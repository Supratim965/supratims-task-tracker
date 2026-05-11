import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { chartColors } from "../constants";

export default function AnalyticsPanel({ analytics }) {
  return (
    <section className="card full">
      <h2>QA Analytics Dashboard</h2>
      <div className="analytics">
        <div className="chart">
          <h3>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={analytics.byStatus} dataKey="value" nameKey="name" outerRadius={90}>
                {analytics.byStatus.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart">
          <h3>Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.byPriority}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#6366f1" /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart">
          <h3>Monthly Bug Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics.monthlyBugTrends}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="bugs" stroke="#ef4444" /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart">
          <h3>Developer-wise Issue Count</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.developerIssues}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#d946ef" /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="metrics">Completed vs Failed: {analytics.passFail.passed} / {analytics.passFail.failed} | QA Pass/Fail ratio: {analytics.passFail.failed ? (analytics.passFail.passed / analytics.passFail.failed).toFixed(2) : "N/A"}</p>
    </section>
  );
}
