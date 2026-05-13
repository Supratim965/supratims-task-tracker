import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppProvider, useApp } from "./context/AppContext";
import TaskForm from "./components/TaskForm";
import QAForm from "./components/QAForm";
import FiltersBar from "./components/FiltersBar";
import TaskTable from "./components/TaskTable";
import { ActivityTimeline, TaskHistoryPanel } from "./components/TimelinePanels";
import AnalyticsPanel from "./components/AnalyticsPanel";
import SqlConsole from "./components/SqlConsole";
import TeamMemberManager from "./components/TeamMemberManager";

function AppContent() {
  const {
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
    filters,
    setFilters,
    qaForm,
    setQaForm,
    query,
    setQuery,
    queryRows,
    loading,
    submitting,
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
  } = useApp();

  return (
    <div className="app">
      <header className="topbar">
        <h1>Supratim's Task Tracker portal</h1>
        <button className="theme-btn" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </header>

      <main className="grid">
        <TaskForm editId={editId} taskForm={taskForm} setTaskForm={setTaskForm} submitTask={submitTask} resetTaskForm={resetTaskForm} developers={developers} designers={designers} qas={qas} submitting={submitting} />
        <QAForm qaForm={qaForm} setQaForm={setQaForm} submitQaLog={submitQaLog} tasks={tasks} submitting={submitting} />
        <FiltersBar filters={filters} setFilters={setFilters} developers={developers} designers={designers} qas={qas} />
        <TeamMemberManager
          developers={developers}
          designers={designers}
          addUser={addUser}
          updateUser={updateUser}
          deleteUser={deleteUser}
        />
        <TaskTable loading={loading} filteredTasks={filteredTasks} startEdit={startEdit} removeTask={removeTask} setActiveTaskId={setActiveTaskId} />
        <ActivityTimeline qaLogs={qaLogs} />
        <TaskHistoryPanel history={history} activeTaskId={activeTaskId} />
        <AnalyticsPanel analytics={analytics} />
        <SqlConsole query={query} setQuery={setQuery} runQuery={runQuery} queryRows={queryRows} />
      </main>

      <ToastContainer position="bottom-right" theme={theme} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
