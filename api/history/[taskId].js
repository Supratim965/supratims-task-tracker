import { getDb, COLLECTIONS, serializeAll, toId } from '../_db.js';

export default async function handler(req, res) {
  const db      = await getDb();
  const taskOid = toId(req.query.taskId);
  if (!taskOid) return res.status(400).json({ error: 'Invalid taskId' });

  try {
    const [statusResult, assignResult] = await Promise.all([
      db.collection(COLLECTIONS.statusHistory)
        .find({ task_id: taskOid })
        .sort({ changed_at: -1 })
        .toArray(),

      db.collection(COLLECTIONS.assignmentHistory).aggregate([
        { $match: { task_id: taskOid } },
        { $lookup: { from: COLLECTIONS.users, localField: 'from_user_id', foreignField: '_id', as: '_from' } },
        { $lookup: { from: COLLECTIONS.users, localField: 'to_user_id',   foreignField: '_id', as: '_to'   } },
        {
          $addFields: {
            from_user_name: { $arrayElemAt: ['$_from.name', 0] },
            to_user_name:   { $arrayElemAt: ['$_to.name',   0] },
          },
        },
        { $project: { _from: 0, _to: 0 } },
        { $sort: { changed_at: -1 } },
      ]).toArray(),
    ]);

    res.json({ statuses: serializeAll(statusResult), assignments: serializeAll(assignResult) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
