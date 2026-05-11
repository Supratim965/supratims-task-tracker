export function ActivityTimeline({ qaLogs }) {
  return (
    <section className="card">
      <h2>Activity Timeline</h2>
      <div className="timeline">
        {qaLogs.slice(0, 8).map((log) => (
          <div className="timeline-item" key={log.id}>
            <p><strong>Task #{log.task_id}</strong> - {log.task_title}</p>
            <p>{log.qa_result || "Note"} | {log.retesting_status || "No retesting update"}</p>
            <small>{log.created_at}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TaskHistoryPanel({ history, activeTaskId }) {
  return (
    <section className="card">
      <h2>Task History {activeTaskId ? `(Task #${activeTaskId})` : ""}</h2>
      <div className="timeline">
        {history.statuses.slice(0, 6).map((entry) => (
          <div className="timeline-item" key={`s-${entry.id}`}>
            <p>Status: {entry.from_status || "New"} {"->"} {entry.to_status}</p>
            <small>{entry.changed_by} | {entry.changed_at}</small>
          </div>
        ))}
        {history.assignments.slice(0, 6).map((entry) => (
          <div className="timeline-item" key={`a-${entry.id}`}>
            <p>{entry.role}: {entry.from_user_name || "Unassigned"} {"->"} {entry.to_user_name || "Unassigned"}</p>
            <small>{entry.changed_by} | {entry.changed_at}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
