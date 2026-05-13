import { priorities, statuses } from "../constants";
import SearchableUserSelect from "./SearchableUserSelect";

export default function TaskForm({ editId, taskForm, setTaskForm, submitTask, resetTaskForm, developers, designers, qas, submitting }) {
  return (
    <section className="card">
      <h2>{editId ? "Edit Task" : "Create Task"}</h2>
      <form className="stack" onSubmit={submitTask}>
        <input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
        <textarea placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} required />
        <input placeholder="Bug/Test reference" value={taskForm.bug_reference} onChange={(e) => setTaskForm({ ...taskForm, bug_reference: e.target.value })} required />
        <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} required />
        <div className="inline">
          <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} required>{priorities.map((p) => <option key={p}>{p}</option>)}</select>
          <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} required>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="inline">
          <SearchableUserSelect
            listId="developer-assignment-list"
            users={developers}
            value={taskForm.assigned_developer_id}
            placeholder="Search/select Developer"
            onChange={(id) => setTaskForm({ ...taskForm, assigned_developer_id: id })}
            required
          />
          <SearchableUserSelect
            listId="designer-assignment-list"
            users={designers}
            value={taskForm.assigned_designer_id}
            placeholder="Search/select Designer"
            onChange={(id) => setTaskForm({ ...taskForm, assigned_designer_id: id })}
            required
          />
          <select value={taskForm.assigned_qa_id} onChange={(e) => setTaskForm({ ...taskForm, assigned_qa_id: e.target.value })}>
            <option value="">Assign QA</option>{qas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="inline">
          <button type="submit" disabled={submitting}>{submitting ? "Processing..." : (editId ? "Update Task" : "Create Task")}</button>
          {editId && <button type="button" onClick={resetTaskForm} disabled={submitting}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}
