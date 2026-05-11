import { qaResults } from "../constants";

export default function QAForm({ qaForm, setQaForm, submitQaLog, tasks }) {
  return (
    <section className="card">
      <h2>QA Workflow</h2>
      <form className="stack" onSubmit={submitQaLog}>
        <select value={qaForm.task_id} onChange={(e) => setQaForm({ ...qaForm, task_id: e.target.value })} required>
          <option value="">Select Task</option>
          {tasks.map((task) => <option key={task.id} value={task.id}>#{task.id} - {task.title}</option>)}
        </select>
        <textarea placeholder="Testing notes" value={qaForm.testing_notes} onChange={(e) => setQaForm({ ...qaForm, testing_notes: e.target.value })} />
        <textarea placeholder="Bug remarks" value={qaForm.bug_remarks} onChange={(e) => setQaForm({ ...qaForm, bug_remarks: e.target.value })} />
        <div className="inline">
          <select value={qaForm.qa_result} onChange={(e) => setQaForm({ ...qaForm, qa_result: e.target.value })}>{qaResults.map((r) => <option key={r}>{r}</option>)}</select>
          <input placeholder="Retesting status" value={qaForm.retesting_status} onChange={(e) => setQaForm({ ...qaForm, retesting_status: e.target.value })} />
        </div>
        <button type="submit">Save QA Log</button>
      </form>
    </section>
  );
}
