export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.status(400).json({
    error: 'SQL console is not available with MongoDB. Use MongoDB Atlas UI or MongoDB Compass for direct database queries.',
  });
}
