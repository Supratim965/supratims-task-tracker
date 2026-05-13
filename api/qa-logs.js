import { getDb, COLLECTIONS, serialize, serializeAll, toId } from './_db.js';
import { QA_RESULTS, addStatusHistory } from './_helpers.js';

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method === 'GET') {
    try {
      const logs = await db.collection(COLLECTIONS.qaLogs).aggregate([
        { $sort: { created_at: -1 } },
        { $lookup: { from: COLLECTIONS.tasks, localField: 'task_id', foreignField: '_id', as: '_task' } },
        { $addFields: { task_title: { $arrayElemAt: ['$_task.title', 0] } } },
        { $project: { _task: 0 } },
      ]).toArray();
      res.json(serializeAll(logs));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else if (req.method === 'POST') {
    try {
      const { task_id, testing_notes, bug_remarks, qa_result, retesting_status, created_by = 'qa_user' } = req.body;
      if (!task_id) return res.status(400).json({ error: 'task_id is required' });
      if (qa_result && !QA_RESULTS.includes(qa_result)) return res.status(400).json({ error: 'Invalid qa_result' });

      const taskOid = toId(task_id);
      if (!taskOid) return res.status(400).json({ error: 'Invalid task_id' });

      const { insertedId } = await db.collection(COLLECTIONS.qaLogs).insertOne({
        task_id:          taskOid,
        testing_notes:    testing_notes    || '',
        bug_remarks:      bug_remarks      || '',
        qa_result:        qa_result        || null,
        retesting_status: retesting_status || '',
        created_by,
        created_at: new Date(),
      });

      if (qa_result === 'Pass') {
        await db.collection(COLLECTIONS.tasks).updateOne(
          { _id: taskOid },
          { $set: { status: 'QA Passed', qa_retesting_status: retesting_status || 'Done', updated_at: new Date() } }
        );
        await addStatusHistory(db, task_id, null, 'QA Passed', created_by);
      } else if (qa_result === 'Fail') {
        await db.collection(COLLECTIONS.tasks).updateOne(
          { _id: taskOid },
          { $set: { status: 'QA Failed', qa_retesting_status: retesting_status || 'Required', updated_at: new Date() } }
        );
        await addStatusHistory(db, task_id, null, 'QA Failed', created_by);
      } else if (qa_result === 'Blocked') {
        await db.collection(COLLECTIONS.tasks).updateOne(
          { _id: taskOid },
          { $set: { status: 'On Hold', updated_at: new Date() } }
        );
        await addStatusHistory(db, task_id, null, 'On Hold', created_by);
      }

      const log = await db.collection(COLLECTIONS.qaLogs).findOne({ _id: insertedId });
      res.status(201).json(serialize(log));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
