import { getDb, COLLECTIONS, serialize, serializeAll } from './_db.js';

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method === 'GET') {
    try {
      const users = await db.collection(COLLECTIONS.users)
        .find({}, { projection: { name: 1, role: 1 } })
        .sort({ role: 1, name: 1 })
        .toArray();
      res.json(serializeAll(users));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else if (req.method === 'POST') {
    try {
      const { name, role } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
      if (!['Developer', 'Designer'].includes(role)) {
        return res.status(400).json({ error: 'Only Developer or Designer can be created here' });
      }
      const dup = await db.collection(COLLECTIONS.users).findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        role,
      });
      if (dup) return res.status(400).json({ error: `${role} name already exists` });

      const { insertedId } = await db.collection(COLLECTIONS.users).insertOne({ name: name.trim(), role });
      const created = await db.collection(COLLECTIONS.users).findOne({ _id: insertedId });
      res.status(201).json(serialize(created));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
