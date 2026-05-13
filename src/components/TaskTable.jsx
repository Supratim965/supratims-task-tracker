export default function TaskTable({ loading, filteredTasks, startEdit, removeTask, setActiveTaskId }) {
  return (
    <section className="card full">
      <h2>Task Table</h2>
      {loading ? <p className="skeleton">Loading tasks...</p> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Due</th><th>Developer</th><th>Designer</th><th>QA</th><th>Updated</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>#{task.id}</td>
                  <td>{task.title}</td>
                  <td>{task.status}</td>
                  <td>{task.priority}</td>
                  <td>{task.due_date || "-"}</td>
                  <td>{task.developer_name || "-"}</td>
                  <td>{task.designer_name || "-"}</td>
                  <td>{task.qa_name || "-"}</td>
                  <td>{task.updated_at?.replace("T", " ").slice(0, 16) || "-"}</td>
                  <td>
                    <button type="button" onClick={() => startEdit(task)}>Edit</button>
                    <button type="button" onClick={() => removeTask(task.id)} className="danger">Delete</button>
                    <button type="button" onClick={() => setActiveTaskId(task.id)}>History</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
