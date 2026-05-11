import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { emptyFilters, emptyQaForm, emptyTask, priorities } from "../constants";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [qaLogs, setQaLogs] = useState([]);
  const [analytics, setAnalytics] = useState({ byStatus: [], byPriority: [], passFail: { passed: 0, failed: 0 }, developerIssues: [], monthlyBugTrends: [] });
  const [history, setHistory] = useState({ statuses: [], assignments: [] });
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [editId, setEditId] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [qaForm, setQaForm] = useState(emptyQaForm);
  const [query, setQuery] = useState("SELECT * FROM tasks WHERE status = 'QA Failed';");
  const [queryRows, setQueryRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const developers = useMemo(() => users.filter((u) => u.role === "Developer"), [users]);
  const designers = useMemo(() => users.filter((u) => u.role === "Designer"), [users]);
  const qas = useMemo(() => users.filter((u) => u.role === "QA"), [users]);

  const filteredTasks = useMemo(() => {
    const search = filters.search.toLowerCase();
    const output = tasks.filter((task) => {
      const bySearch = task.title.toLowerCase().includes(search) || String(task.id).includes(search);
      const byDev = !filters.developer || String(task.assigned_developer_id || "") === filters.developer;
      const byDesigner = !filters.designer || String(task.assigned_designer_id || "") === filters.designer;
      const byQa = !filters.qa || String(task.assigned_qa_id || "") === filters.qa;
      const byStatus = !filters.status || task.status === filters.status;
      const byPriority = !filters.priority || task.priority === filters.priority;
      return bySearch && byDev && byDesigner && byQa && byStatus && byPriority;
    });
    output.sort((a, b) => {
      if (filters.sortBy === "due") return (a.due_date || "").localeCompare(b.due_date || "");
      if (filters.sortBy === "priority") return priorities.indexOf(b.priority) - priorities.indexOf(a.priority);
      return (b.updated_at || "").localeCompare(a.updated_at || "");
    });
    return output;
  }, [tasks, filters]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [taskData, userData, logData, analyticsData] = await Promise.all([api("/tasks"), api("/users"), api("/qa-logs"), api("/analytics/overview")]);
      setTasks(taskData);
      setUsers(userData);
      setQaLogs(logData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!activeTaskId) return;
    api(`/history/${activeTaskId}`).then(setHistory).catch(() => setHistory({ statuses: [], assignments: [] }));
  }, [activeTaskId, qaLogs, tasks]);

  const resetTaskForm = () => {
    setTaskForm(emptyTask);
    setEditId(null);
  };

  const submitTask = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...taskForm,
        assigned_developer_id: taskForm.assigned_developer_id || null,
        assigned_designer_id: taskForm.assigned_designer_id || null,
        assigned_qa_id: taskForm.assigned_qa_id || null,
      };
      if (editId) {
        await api(`/tasks/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Task updated");
      } else {
        await api("/tasks", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Task created");
      }
      resetTaskForm();
      fetchAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const startEdit = (task) => {
    setEditId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      bug_reference: task.bug_reference || "",
      due_date: task.due_date || "",
      priority: task.priority,
      status: task.status,
      assigned_developer_id: task.assigned_developer_id || "",
      assigned_designer_id: task.assigned_designer_id || "",
      assigned_qa_id: task.assigned_qa_id || "",
    });
  };

  const removeTask = async (id) => {
    try {
      await api(`/tasks/${id}`, { method: "DELETE" });
      toast.success("Task deleted");
      fetchAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submitQaLog = async (event) => {
    event.preventDefault();
    try {
      await api("/qa-logs", { method: "POST", body: JSON.stringify({ ...qaForm, task_id: Number(qaForm.task_id) }) });
      toast.success("QA note added");
      setQaForm(emptyQaForm);
      fetchAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const runQuery = async (event) => {
    event.preventDefault();
    try {
      const result = await api("/query", { method: "POST", body: JSON.stringify({ sql: query }) });
      setQueryRows(result.rows);
      toast.success(`Query executed: ${result.count} rows`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addUser = async ({ role, name }) => {
    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({ role, name }),
      });
      toast.success(`${role} added`);
      fetchAll();
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateUser = async (id, name) => {
    try {
      await api(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      toast.success("Team member updated");
      fetchAll();
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      await api(`/users/${id}`, { method: "DELETE" });
      toast.success("Team member deleted");
      fetchAll();
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        tasks,
        qaLogs,
        analytics,
        history,
        activeTaskId,
        setActiveTaskId,
        taskForm,
        setTaskForm,
        editId,
        setEditId,
        filters,
        setFilters,
        qaForm,
        setQaForm,
        query,
        setQuery,
        queryRows,
        loading,
        developers,
        designers,
        qas,
        filteredTasks,
        submitTask,
        startEdit,
        removeTask,
        resetTaskForm,
        submitQaLog,
        runQuery,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
