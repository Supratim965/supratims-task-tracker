import { getDb, COLLECTIONS, serialize, toId } from '../_db.js';
import { validateTaskInput, addStatusHistory, addAssignmentHistory } from '../_helpers.js';

export default async function handler(req, res) {
  const db  = await getDb();
  const oid = toId(req.query.id);
  if (!oid) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'PUT') {
    try {
      const existingDoc = await db.collection(COLLECTIONS.tasks).findOne({ _id: oid });
      if (!existingDoc) return res.status(404).json({ error: 'Task not found' });
      const existing = serialize(existingDoc);

      const next = {
        title:                 req.body.title                 ?? existing.title,
        description:           req.body.description           ?? existing.description,
        bug_reference:         req.body.bug_reference         ?? existing.bug_reference,
        due_date:              req.body.due_date               ?? existing.due_date,
        priority:              req.body.priority               ?? existing.priority,
        status:                req.body.status                 ?? existing.status,
        assigned_developer_id: req.body.assigned_developer_id ?? existing.assigned_developer_id,
        assigned_designer_id:  req.body.assigned_designer_id  ?? existing.assigned_designer_id,
        assigned_qa_id:        req.body.assigned_qa_id         ?? existing.assigned_qa_id,
        qa_retesting_status:   req.body.qa_retesting_status    ?? existing.qa_retesting_status,
      };

      const err = validateTaskInput(next);
      if (err) return res.status(400).json({ error: err });

      await db.collection(COLLECTIONS.tasks).updateOne(
        { _id: oid },
        {
          $set: {
            title:                 next.title.trim(),
            description:           next.description || '',
            bug_reference:         next.bug_reference || '',
            due_date:              next.due_date || null,
            priority:              next.priority,
            status:                next.status,
            assigned_developer_id: next.assigned_developer_id ? toId(next.assigned_developer_id) : null,
            assigned_designer_id:  next.assigned_designer_id  ? toId(next.assigned_designer_id)  : null,
            assigned_qa_id:        next.assigned_qa_id         ? toId(next.assigned_qa_id)         : null,
            qa_retesting_status:   next.qa_retesting_status || 'Not Started',
            updated_at:            new Date(),
          },
        }
      );

      const taskId    = oid.toString();
      const changedBy = req.body.updated_by || 'qa_user';

      if (existing.status !== next.status) {
        await addStatusHistory(db, taskId, existing.status, next.status, changedBy);
      }
      if (existing.assigned_developer_id !== next.assigned_developer_id) {
        await addAssignmentHistory(db, taskId, 'Developer', existing.assigned_developer_id, next.assigned_developer_id, changedBy);
      }
      if (existing.assigned_designer_id !== next.assigned_designer_id) {
        await addAssignmentHistory(db, taskId, 'Designer', existing.assigned_designer_id, next.assigned_designer_id, changedBy);
      }
      if (existing.assigned_qa_id !== next.assigned_qa_id) {
        await addAssignmentHistory(db, taskId, 'QA', existing.assigned_qa_id, next.assigned_qa_id, changedBy);
      }

      const updated = await db.collection(COLLECTIONS.tasks).findOne({ _id: oid });
      res.json(serialize(updated));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else if (req.method === 'DELETE') {
    try {
      await Promise.all([
        db.collection(COLLECTIONS.qaLogs).deleteMany({ task_id: oid }),
        db.collection(COLLECTIONS.statusHistory).deleteMany({ task_id: oid }),
        db.collection(COLLECTIONS.assignmentHistory).deleteMany({ task_id: oid }),
      ]);
      await db.collection(COLLECTIONS.tasks).deleteOne({ _id: oid });
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
