import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { commentSchema } from "@/schemas/comment.schema";
import { taskService } from "@/services/task.service";

export default function TaskDetails({ taskId }) {
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("comments"); // comments | history

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(commentSchema),
  });

  // Use a consistent load function
  const loadData = async () => {
    try {
      const [c, h] = await Promise.all([
        taskService.getComments(taskId),
        taskService.getHistory(taskId),
      ]);
      setComments(c);
      setHistory(h);
    } catch (error) {
      console.error("Failed to load details", error);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, [taskId]);

  const handleAddComment = async (data) => {
    try {
      await taskService.addComment(taskId, data.content);
      reset();
      await loadData();
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment", error);
      toast.error("Failed to add comment");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex gap-4 mb-4 border-b border-gray-100">
        <button
          type="button"
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "comments"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("comments")}
        >
          Comments ({comments.length})
        </button>
        <button
          type="button"
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      {activeTab === "comments" && (
        <div>
          <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {c.user?.username || "Unknown"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">
                No comments yet.
              </p>
            )}
          </div>
          <form
            onSubmit={handleSubmit(handleAddComment)}
            className="flex gap-2 items-start"
          >
            <div className="flex-1">
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Add a comment..."
                {...register("content")}
              />
              {errors.content && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.content.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
              disabled={isSubmitting}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {activeTab === "history" && (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {history.map((h) => (
            <div
              key={h.id}
              className="text-sm pl-3 border-l-2 border-gray-200 py-1"
            >
              <span className="font-semibold text-gray-800">{h.action}</span>:{" "}
              {h.details}
              <div className="text-xs text-gray-400 mt-1">
                {new Date(h.created_at).toLocaleString()}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">
              No history yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
