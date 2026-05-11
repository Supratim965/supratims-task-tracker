const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;
const dbPath = path.join(__dirname, "qa_tracker.db");
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());
const distPath = path.join(__dirname, "..", "dist");

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = [
  "In Queue",
  "In Progress",
  "On Hold",
  "Completed",
  "Terminated",
  "QA Pending",
  "QA Failed",
  "QA Passed",
];
const QA_RESULTS = ["Pass", "Fail", "Blocked"];
const USER_ROLES = ["Developer", "Designer", "QA"];

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function addStatusHistory(taskId, fromStatus, toStatus, changedBy = "system") {
  await run(
    `INSERT INTO status_history (task_id, from_status, to_status, changed_by, changed_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [taskId, fromStatus || null, toStatus, changedBy]
  );
}

async function addAssignmentHistory(taskId, role, fromUserId, toUserId, changedBy = "system") {
  await run(
    `INSERT INTO assignment_history (task_id, role, from_user_id, to_user_id, changed_by, changed_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [taskId, role, fromUserId || null, toUserId || null, changedBy]
  );
}

async function seedUsers() {
  const existing = await get("SELECT COUNT(*) as count FROM users");
  if (existing.count > 0) return;

  const seed = [
    { name: "Dev Asha", role: "Developer" },
    { name: "Dev Rahul", role: "Developer" },
    { name: "Design Neha", role: "Designer" },
    { name: "Design Kiran", role: "Designer" },
    { name: "QA Priya", role: "QA" },
    { name: "QA Arjun", role: "QA" },
  ];

  for (const user of seed) {
    await run("INSERT INTO users (name, role) VALUES (?, ?)", [user.name, user.role]);
  }
}

function initDb() {
  db.serialize(async () => {
    db.run("PRAGMA foreign_keys = ON");

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        bug_reference TEXT,
        due_date TEXT,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_developer_id INTEGER,
        assigned_designer_id INTEGER,
        assigned_qa_id INTEGER,
        qa_retesting_status TEXT DEFAULT 'Not Started',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (assigned_developer_id) REFERENCES users(id),
        FOREIGN KEY (assigned_designer_id) REFERENCES users(id),
        FOREIGN KEY (assigned_qa_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS qa_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        testing_notes TEXT,
        bug_remarks TEXT,
        qa_result TEXT,
        retesting_status TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        from_status TEXT,
        to_status TEXT NOT NULL,
        changed_by TEXT,
        changed_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS assignment_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        from_user_id INTEGER,
        to_user_id INTEGER,
        changed_by TEXT,
        changed_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    await seedUsers();
  });
}

function validateTaskInput(data) {
  if (!data.title || !data.title.trim()) return "Task title is required";
  if (!PRIORITIES.includes(data.priority)) return "Invalid priority";
  if (!STATUSES.includes(data.status)) return "Invalid status";
  return null;
}

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/users", async (_, res) => {
  try {
    const users = await all("SELECT id, name, role FROM users ORDER BY role, name");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
    if (!["Developer", "Designer"].includes(role)) {
      return res.status(400).json({ error: "Only Developer or Designer can be created here" });
    }

    const existing = await get(
      "SELECT id FROM users WHERE LOWER(name) = LOWER(?) AND role = ?",
      [name.trim(), role]
    );
    if (existing) return res.status(400).json({ error: `${role} name already exists` });

    const result = await run("INSERT INTO users (name, role) VALUES (?, ?)", [name.trim(), role]);
    const created = await get("SELECT id, name, role FROM users WHERE id = ?", [result.lastID]);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    const existing = await get("SELECT id, name, role FROM users WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: "User not found" });
    if (!["Developer", "Designer"].includes(existing.role)) {
      return res.status(400).json({ error: "Only Developer/Designer profiles are editable here" });
    }
    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });

    const duplicate = await get(
      "SELECT id FROM users WHERE LOWER(name) = LOWER(?) AND role = ? AND id != ?",
      [name.trim(), existing.role, id]
    );
    if (duplicate) return res.status(400).json({ error: `${existing.role} name already exists` });

    await run("UPDATE users SET name = ? WHERE id = ?", [name.trim(), id]);
    const updated = await get("SELECT id, name, role FROM users WHERE id = ?", [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await get("SELECT id, role FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!["Developer", "Designer"].includes(user.role)) {
      return res.status(400).json({ error: "Only Developer/Designer profiles are removable here" });
    }

    if (user.role === "Developer") {
      await run(
        "UPDATE tasks SET assigned_developer_id = NULL, updated_at = datetime('now') WHERE assigned_developer_id = ?",
        [id]
      );
    } else if (user.role === "Designer") {
      await run(
        "UPDATE tasks SET assigned_designer_id = NULL, updated_at = datetime('now') WHERE assigned_designer_id = ?",
        [id]
      );
    }

    await run("DELETE FROM users WHERE id = ?", [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/tasks", async (_, res) => {
  try {
    const tasks = await all(
      `SELECT
        t.*,
        d.name as developer_name,
        ds.name as designer_name,
        q.name as qa_name
      FROM tasks t
      LEFT JOIN users d ON t.assigned_developer_id = d.id
      LEFT JOIN users ds ON t.assigned_designer_id = ds.id
      LEFT JOIN users q ON t.assigned_qa_id = q.id
      ORDER BY datetime(t.updated_at) DESC`
    );
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const validationError = validateTaskInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const {
      title,
      description,
      bug_reference,
      due_date,
      priority,
      status,
      assigned_developer_id,
      assigned_designer_id,
      assigned_qa_id,
      created_by = "qa_user",
    } = req.body;

    const result = await run(
      `INSERT INTO tasks (
        title, description, bug_reference, due_date, priority, status,
        assigned_developer_id, assigned_designer_id, assigned_qa_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        title.trim(),
        description || "",
        bug_reference || "",
        due_date || null,
        priority,
        status,
        assigned_developer_id || null,
        assigned_designer_id || null,
        assigned_qa_id || null,
      ]
    );

    await addStatusHistory(result.lastID, null, status, created_by);
    if (assigned_developer_id) {
      await addAssignmentHistory(result.lastID, "Developer", null, assigned_developer_id, created_by);
    }
    if (assigned_designer_id) {
      await addAssignmentHistory(result.lastID, "Designer", null, assigned_designer_id, created_by);
    }
    if (assigned_qa_id) {
      await addAssignmentHistory(result.lastID, "QA", null, assigned_qa_id, created_by);
    }

    const task = await get("SELECT * FROM tasks WHERE id = ?", [result.lastID]);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await get("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: "Task not found" });

    const next = {
      ...existing,
      ...req.body,
      title: req.body.title ?? existing.title,
      description: req.body.description ?? existing.description,
      bug_reference: req.body.bug_reference ?? existing.bug_reference,
      due_date: req.body.due_date ?? existing.due_date,
      priority: req.body.priority ?? existing.priority,
      status: req.body.status ?? existing.status,
      assigned_developer_id: req.body.assigned_developer_id ?? existing.assigned_developer_id,
      assigned_designer_id: req.body.assigned_designer_id ?? existing.assigned_designer_id,
      assigned_qa_id: req.body.assigned_qa_id ?? existing.assigned_qa_id,
      qa_retesting_status: req.body.qa_retesting_status ?? existing.qa_retesting_status,
    };

    const validationError = validateTaskInput(next);
    if (validationError) return res.status(400).json({ error: validationError });

    await run(
      `UPDATE tasks
       SET title = ?, description = ?, bug_reference = ?, due_date = ?, priority = ?, status = ?,
           assigned_developer_id = ?, assigned_designer_id = ?, assigned_qa_id = ?,
           qa_retesting_status = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        next.title.trim(),
        next.description || "",
        next.bug_reference || "",
        next.due_date || null,
        next.priority,
        next.status,
        next.assigned_developer_id || null,
        next.assigned_designer_id || null,
        next.assigned_qa_id || null,
        next.qa_retesting_status || "Not Started",
        id,
      ]
    );

    const changedBy = req.body.updated_by || "qa_user";
    if (existing.status !== next.status) {
      await addStatusHistory(id, existing.status, next.status, changedBy);
    }
    if (existing.assigned_developer_id !== next.assigned_developer_id) {
      await addAssignmentHistory(
        id,
        "Developer",
        existing.assigned_developer_id,
        next.assigned_developer_id,
        changedBy
      );
    }
    if (existing.assigned_designer_id !== next.assigned_designer_id) {
      await addAssignmentHistory(
        id,
        "Designer",
        existing.assigned_designer_id,
        next.assigned_designer_id,
        changedBy
      );
    }
    if (existing.assigned_qa_id !== next.assigned_qa_id) {
      await addAssignmentHistory(id, "QA", existing.assigned_qa_id, next.assigned_qa_id, changedBy);
    }

    const updated = await get("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await run("DELETE FROM tasks WHERE id = ?", [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/qa-logs", async (_, res) => {
  try {
    const logs = await all(
      `SELECT ql.*, t.title as task_title
       FROM qa_logs ql
       JOIN tasks t ON ql.task_id = t.id
       ORDER BY datetime(ql.created_at) DESC`
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/qa-logs", async (req, res) => {
  try {
    const { task_id, testing_notes, bug_remarks, qa_result, retesting_status, created_by = "qa_user" } =
      req.body;
    if (!task_id) return res.status(400).json({ error: "task_id is required" });
    if (qa_result && !QA_RESULTS.includes(qa_result)) return res.status(400).json({ error: "Invalid qa_result" });

    const result = await run(
      `INSERT INTO qa_logs (task_id, testing_notes, bug_remarks, qa_result, retesting_status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [task_id, testing_notes || "", bug_remarks || "", qa_result || null, retesting_status || "", created_by]
    );

    if (qa_result === "Pass") {
      await run(
        "UPDATE tasks SET status = 'QA Passed', qa_retesting_status = ?, updated_at = datetime('now') WHERE id = ?",
        [retesting_status || "Done", task_id]
      );
      await addStatusHistory(task_id, null, "QA Passed", created_by);
    } else if (qa_result === "Fail") {
      await run(
        "UPDATE tasks SET status = 'QA Failed', qa_retesting_status = ?, updated_at = datetime('now') WHERE id = ?",
        [retesting_status || "Required", task_id]
      );
      await addStatusHistory(task_id, null, "QA Failed", created_by);
    } else if (qa_result === "Blocked") {
      await run("UPDATE tasks SET status = 'On Hold', updated_at = datetime('now') WHERE id = ?", [task_id]);
      await addStatusHistory(task_id, null, "On Hold", created_by);
    }

    const log = await get("SELECT * FROM qa_logs WHERE id = ?", [result.lastID]);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/history/:taskId", async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const statuses = await all(
      "SELECT * FROM status_history WHERE task_id = ? ORDER BY datetime(changed_at) DESC",
      [taskId]
    );
    const assignments = await all(
      `SELECT ah.*, fu.name as from_user_name, tu.name as to_user_name
       FROM assignment_history ah
       LEFT JOIN users fu ON ah.from_user_id = fu.id
       LEFT JOIN users tu ON ah.to_user_id = tu.id
       WHERE ah.task_id = ?
       ORDER BY datetime(ah.changed_at) DESC`,
      [taskId]
    );
    res.json({ statuses, assignments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/overview", async (_, res) => {
  try {
    const byStatus = await all("SELECT status as name, COUNT(*) as value FROM tasks GROUP BY status");
    const byPriority = await all("SELECT priority as name, COUNT(*) as value FROM tasks GROUP BY priority");
    const passFail = await all(
      `SELECT
        SUM(CASE WHEN status = 'QA Passed' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = 'QA Failed' THEN 1 ELSE 0 END) as failed
       FROM tasks`
    );
    const developerIssues = await all(
      `SELECT COALESCE(u.name, 'Unassigned') as name, COUNT(t.id) as value
       FROM tasks t
       LEFT JOIN users u ON t.assigned_developer_id = u.id
       WHERE t.status IN ('QA Failed', 'Terminated', 'On Hold')
       GROUP BY COALESCE(u.name, 'Unassigned')
       ORDER BY value DESC`
    );
    const weeklyStatus = await all(
      `SELECT strftime('%Y-%W', updated_at) as week, status, COUNT(*) as count
       FROM tasks
       GROUP BY week, status
       ORDER BY week DESC
       LIMIT 12`
    );
    const monthlyBugTrends = await all(
      `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as bugs
       FROM tasks
       WHERE status = 'QA Failed'
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`
    );

    res.json({
      byStatus,
      byPriority,
      passFail: passFail[0] || { passed: 0, failed: 0 },
      developerIssues,
      weeklyStatus,
      monthlyBugTrends,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/query", async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || !sql.trim()) return res.status(400).json({ error: "SQL query is required" });
    const normalized = sql.trim().toLowerCase();

    const forbidden = ["drop", "delete", "update", "alter", "insert", "create", "truncate", "pragma"];
    if (!normalized.startsWith("select")) {
      return res.status(400).json({ error: "Only SELECT queries are allowed" });
    }
    if (forbidden.some((keyword) => normalized.includes(keyword))) {
      return res.status(400).json({ error: "Forbidden SQL operation detected" });
    }

    const rows = await all(sql);
    res.json({ rows, count: rows.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((_, res) => {
  res.status(404).json({ error: "Not found" });
});

initDb();
app.listen(PORT, () => {
  console.log(`QA Task Tracker API running on http://localhost:${PORT}`);
});
