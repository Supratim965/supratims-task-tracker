import { getDb, COLLECTIONS, serialize, serializeAll, toId } from './_db.js';
import { validateTaskInput, addStatusHistory, addAssignmentHistory } from './_helpers.js';

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method === 'GET') {
    try {
      const tasks = await db.collection(COLLECTIONS.tasks).aggregate([
        { $sort: { updated_at: -1 } },
        { $lookup: { from: COLLECTIONS.users, localField: 'assigned_developer_id', foreignField: '_id', as: '_dev' } },
        { $lookup: { from: COLLECTIONS.users, localField: 'assigned_designer_id',  foreignField: '_id', as: '_ds'  } },
        { $lookup: { from: COLLECTIONS.users, localField: 'assigned_qa_id',         foreignField: '_id', as: '_qa'  } },
        {
          $addFields: {
            developer_name: { $arrayElemAt: ['$_dev.name', 0] },
            designer_name:  { $arrayElemAt: ['$_ds.name',  0] },
            qa_name:        { $arrayElemAt: ['$_qa.name',  0] },
          },
        },
        { $project: { _dev: 0, _ds: 0, _qa: 0 } },
      ]).toArray();
      res.json(serializeAll(tasks));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else if (req.method === 'POST') {
    try {
      const err = validateTaskInput(req.body);
      if (err) return res.status(400).json({ error: err });

      const {
        title, description, bug_reference, due_date, priority, status,
        assigned_developer_id, assigned_designer_id, assigned_qa_id,
        created_by = 'qa_user',
      } = req.body;

      const now = new Date();
      const { insertedId } = await db.collection(COLLECTIONS.tasks).insertOne({
        title:                 title.trim(),
        description:           description || '',
        bug_reference:         bug_reference || '',
        due_date:              due_date || null,
        priority,
        status,
        assigned_developer_id: assigned_developer_id ? toId(assigned_developer_id) : null,
        assigned_designer_id:  assigned_designer_id  ? toId(assigned_designer_id)  : null,
        assigned_qa_id:        assigned_qa_id         ? toId(assigned_qa_id)         : null,
        qa_retesting_status:   'Not Started',
        created_at:            now,
        updated_at:            now,
      });

      const taskId = insertedId.toString();
      await addStatusHistory(db, taskId, null, status, created_by);
      if (assigned_developer_id) await addAssignmentHistory(db, taskId, 'Developer', null, assigned_developer_id, created_by);
      if (assigned_designer_id)  await addAssignmentHistory(db, taskId, 'Designer',  null, assigned_designer_id,  created_by);
      if (assigned_qa_id)        await addAssignmentHistory(db, taskId, 'QA',        null, assigned_qa_id,        created_by);

      const task = await db.collection(COLLECTIONS.tasks).findOne({ _id: insertedId });
      res.status(201).json(serialize(task));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
