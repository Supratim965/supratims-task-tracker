import { getDb, COLLECTIONS, serialize, toId } from '../_db.js';

export default async function handler(req, res) {
  const db  = await getDb();
  const oid = toId(req.query.id);
  if (!oid) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'PUT') {
    try {
      const user = await db.collection(COLLECTIONS.users).findOne({ _id: oid });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!['Developer', 'Designer'].includes(user.role)) {
        return res.status(400).json({ error: 'Only Developer/Designer profiles are editable here' });
      }
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

      const dup = await db.collection(COLLECTIONS.users).findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        role: user.role,
        _id: { $ne: oid },
      });
      if (dup) return res.status(400).json({ error: `${user.role} name already exists` });

      await db.collection(COLLECTIONS.users).updateOne({ _id: oid }, { $set: { name: name.trim() } });
      const updated = await db.collection(COLLECTIONS.users).findOne({ _id: oid });
      res.json(serialize(updated));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else if (req.method === 'DELETE') {
    try {
      const user = await db.collection(COLLECTIONS.users).findOne({ _id: oid });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!['Developer', 'Designer'].includes(user.role)) {
        return res.status(400).json({ error: 'Only Developer/Designer profiles are removable here' });
      }
      const col = user.role === 'Developer' ? 'assigned_developer_id' : 'assigned_designer_id';
      await db.collection(COLLECTIONS.tasks).updateMany(
        { [col]: oid },
        { $set: { [col]: null, updated_at: new Date() } }
      );
      await db.collection(COLLECTIONS.users).deleteOne({ _id: oid });
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
