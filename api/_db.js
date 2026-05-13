import { MongoClient, ObjectId } from 'mongodb';

export const COLLECTIONS = {
  users:             process.env.MONGODB_COLLECTION_USERS              || 'users',
  tasks:             process.env.MONGODB_COLLECTION_TASKS              || 'tasks',
  qaLogs:            process.env.MONGODB_COLLECTION_QA_LOGS            || 'qa_logs',
  statusHistory:     process.env.MONGODB_COLLECTION_STATUS_HISTORY     || 'status_history',
  assignmentHistory: process.env.MONGODB_COLLECTION_ASSIGNMENT_HISTORY || 'assignment_history',
};

let _client = null;
let _seeded  = false;

async function getClient() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGODB_URI);
    await _client.connect();
  }
  return _client;
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection(COLLECTIONS.statusHistory).createIndex({ task_id: 1 }),
    db.collection(COLLECTIONS.assignmentHistory).createIndex({ task_id: 1 }),
    db.collection(COLLECTIONS.qaLogs).createIndex({ task_id: 1 }),
    db.collection(COLLECTIONS.tasks).createIndex({ updated_at: -1 }),
  ]);
}

async function seedUsers(db) {
  const count = await db.collection(COLLECTIONS.users).countDocuments();
  if (count > 0) return;
  await db.collection(COLLECTIONS.users).insertMany([
    { name: 'Dev Asha',    role: 'Developer' },
    { name: 'Dev Rahul',   role: 'Developer' },
    { name: 'Design Neha', role: 'Designer'  },
    { name: 'Design Kiran',role: 'Designer'  },
    { name: 'QA Priya',    role: 'QA'        },
    { name: 'QA Arjun',    role: 'QA'        },
  ]);
}

export async function getDb() {
  const client = await getClient();
  const db = client.db(process.env.MONGODB_DB_NAME || 'qa_tracker');
  if (!_seeded) {
    await ensureIndexes(db);
    await seedUsers(db);
    _seeded = true;
  }
  return db;
}

export function toId(id) {
  try { return new ObjectId(String(id)); } catch { return null; }
}

export function serialize(doc) {
  if (!doc) return null;
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (k === '_id')              out.id = v.toString();
    else if (v instanceof ObjectId) out[k] = v.toString();
    else if (v instanceof Date)     out[k] = v.toISOString().replace('T', ' ').slice(0, 19);
    else                            out[k] = v;
  }
  return out;
}

export function serializeAll(docs) {
  return docs.map(serialize);
}
