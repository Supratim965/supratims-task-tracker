import { COLLECTIONS, toId } from './_db.js';

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES   = ['In Queue','In Progress','On Hold','Completed','Terminated','QA Pending','QA Failed','QA Passed'];
export const QA_RESULTS = ['Pass', 'Fail', 'Blocked'];

export function validateTaskInput(data) {
  if (!data.title?.trim())                  return 'Task title is required';
  if (!data.description?.trim())            return 'Description is required';
  if (!data.bug_reference?.trim())          return 'Bug/Test reference is required';
  if (!data.due_date)                       return 'Due date is required';
  if (!PRIORITIES.includes(data.priority))  return 'Invalid priority';
  if (!STATUSES.includes(data.status))      return 'Invalid status';
  if (!data.assigned_developer_id)          return 'Developer assignment is required';
  if (!data.assigned_designer_id)           return 'Designer assignment is required';
  return null;
}

export async function addStatusHistory(db, taskId, fromStatus, toStatus, changedBy = 'system') {
  await db.collection(COLLECTIONS.statusHistory).insertOne({
    task_id:    toId(taskId),
    from_status: fromStatus || null,
    to_status:   toStatus,
    changed_by:  changedBy,
    changed_at:  new Date(),
  });
}

export async function addAssignmentHistory(db, taskId, role, fromUserId, toUserId, changedBy = 'system') {
  await db.collection(COLLECTIONS.assignmentHistory).insertOne({
    task_id:      toId(taskId),
    role,
    from_user_id: fromUserId ? toId(fromUserId) : null,
    to_user_id:   toUserId   ? toId(toUserId)   : null,
    changed_by:   changedBy,
    changed_at:   new Date(),
  });
}
