import { getDb, COLLECTIONS } from '../_db.js';

export default async function handler(req, res) {
  const db = await getDb();
  try {
    const [byStatus, byPriority, passFail, developerIssues, weeklyStatus, monthlyBugTrends] = await Promise.all([

      db.collection(COLLECTIONS.tasks).aggregate([
        { $group: { _id: '$status', value: { $sum: 1 } } },
        { $project: { _id: 0, name: '$_id', value: 1 } },
      ]).toArray(),

      db.collection(COLLECTIONS.tasks).aggregate([
        { $group: { _id: '$priority', value: { $sum: 1 } } },
        { $project: { _id: 0, name: '$_id', value: 1 } },
      ]).toArray(),

      db.collection(COLLECTIONS.tasks).aggregate([
        {
          $group: {
            _id:    null,
            passed: { $sum: { $cond: [{ $eq: ['$status', 'QA Passed'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'QA Failed'] }, 1, 0] } },
          },
        },
        { $project: { _id: 0, passed: 1, failed: 1 } },
      ]).toArray(),

      db.collection(COLLECTIONS.tasks).aggregate([
        { $match: { status: { $in: ['QA Failed', 'Terminated', 'On Hold'] } } },
        { $lookup: { from: COLLECTIONS.users, localField: 'assigned_developer_id', foreignField: '_id', as: '_dev' } },
        {
          $group: {
            _id:   { $ifNull: [{ $arrayElemAt: ['$_dev.name', 0] }, 'Unassigned'] },
            value: { $sum: 1 },
          },
        },
        { $project: { _id: 0, name: '$_id', value: 1 } },
        { $sort: { value: -1 } },
      ]).toArray(),

      db.collection(COLLECTIONS.tasks).aggregate([
        {
          $group: {
            _id: {
              week:   { $dateToString: { format: '%G-%V', date: '$updated_at' } },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, week: '$_id.week', status: '$_id.status', count: 1 } },
        { $sort: { week: -1 } },
        { $limit: 12 },
      ]).toArray(),

      db.collection(COLLECTIONS.tasks).aggregate([
        { $match: { status: 'QA Failed' } },
        {
          $group: {
            _id:  { $dateToString: { format: '%Y-%m', date: '$created_at' } },
            bugs: { $sum: 1 },
          },
        },
        { $project: { _id: 0, month: '$_id', bugs: 1 } },
        { $sort: { month: -1 } },
        { $limit: 12 },
      ]).toArray(),

    ]);

    res.json({
      byStatus,
      byPriority,
      passFail:        passFail[0] || { passed: 0, failed: 0 },
      developerIssues,
      weeklyStatus,
      monthlyBugTrends,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
