export default function SqlConsole({ query, setQuery, runQuery, queryRows }) {
  return (
    <section className="card full">
      <h2>SQL Query Console (SELECT only)</h2>
      <form className="stack" onSubmit={runQuery}>
        <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={4} />
        <button type="submit">Run Query</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{Object.keys(queryRows[0] || { result: "" }).map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {queryRows.map((row, index) => (
              <tr key={index}>
                {Object.keys(row).map((column) => <td key={`${index}-${column}`}>{String(row[column])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
