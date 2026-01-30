import { Edit, Trash2 } from "lucide-react";
import TaskDetails from "./TaskDetails";

export default function TaskCard({
  task,
  user,
  users, // needed for assignee name lookup
  isExpanded,
  onToggleDetails,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAssigneeName = (id) => {
    if (!id) return "Unassigned";
    const u = users.find((u) => u.id === id);
    return u ? u.username : "Unknown";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            {task.title}
            {task.assigned_to_id === user.id && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </h3>
          <p className="text-gray-600 text-sm mb-3">{task.description}</p>

          {/* Task Meta */}
          <div className="flex gap-4 text-xs text-gray-500">
            {task.due_date && (
              <span title="Due Date">📅 {formatDueDate(task.due_date)}</span>
            )}
            <span title="Assigned To">
              👤 {getAssigneeName(task.assigned_to_id)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task, e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <button
              type="button"
              className="p-1 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              onClick={() => onEdit(task)}
              title="Edit Task"
            >
              <Edit size={18} />
            </button>

            <button
              type="button"
              className="p-1 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              onClick={() => onDelete(task.id)}
              title="Delete Task"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => onToggleDetails(task.id)}
          >
            {isExpanded ? "Hide Details" : "Show Comments & History"}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && <TaskDetails taskId={task.id} users={users} />}
    </div>
  );
}
