import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { taskSchema } from "@/schemas/task.schema";

export default function TaskFormModal({
  isOpen,
  onClose,
  mode, // "create" | "edit"
  initialData,
  users,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      due_date: "",
      assigned_to_id: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        reset({
          title: initialData.title,
          description: initialData.description || "",
          due_date: initialData.due_date
            ? initialData.due_date.split("T")[0]
            : "",
          assigned_to_id: initialData.assigned_to_id
            ? String(initialData.assigned_to_id)
            : "",
        });
      } else {
        reset({
          title: "",
          description: "",
          due_date: "",
          assigned_to_id: "",
        });
      }
    }
  }, [isOpen, mode, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4">
          {mode === "create" ? "Create New Task" : "Edit Task"}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              id="task-title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task Title"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-desc"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="task-desc"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description"
              rows="3"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("due_date")}
              />
              {errors.due_date && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.due_date.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <label
                htmlFor="task-assignee"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Assign To
              </label>
              <select
                id="task-assignee"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("assigned_to_id")}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
              {errors.assigned_to_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.assigned_to_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {mode === "create" ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
