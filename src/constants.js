export const priorities = ["Low", "Medium", "High", "Critical"];
export const statuses = [
  "In Queue",
  "In Progress",
  "On Hold",
  "Completed",
  "Terminated",
  "QA Pending",
  "QA Failed",
  "QA Passed",
];
export const qaResults = ["Pass", "Fail", "Blocked"];
export const chartColors = ["#4f46e5", "#0284c7", "#0891b2", "#0ea5e9", "#9333ea", "#db2777", "#e11d48", "#16a34a"];

export const emptyTask = {
  title: "",
  description: "",
  bug_reference: "",
  due_date: "",
  priority: "Medium",
  status: "In Queue",
  assigned_developer_id: "",
  assigned_designer_id: "",
  assigned_qa_id: "",
};

export const emptyQaForm = {
  task_id: "",
  testing_notes: "",
  bug_remarks: "",
  qa_result: "Pass",
  retesting_status: "Not Started",
};

export const emptyFilters = {
  search: "",
  developer: "",
  designer: "",
  qa: "",
  status: "",
  priority: "",
  sortBy: "updated",
};
