import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { commentSchema } from "@/schemas/comment.schema";
import { useTaskDetails, useAddComment } from "@/hooks/useTasks";
import {
  History,
  MessageSquare,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
} from "lucide-react";

export default function TaskDetails({ taskId, users = [] }) {
  const [activeTab, setActiveTab] = useState("comments"); // comments | history

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(commentSchema),
  });

  // React Query
  const { data, isLoading } = useTaskDetails(taskId);
  const comments = data?.comments || [];
  const history = data?.history || [];

  const addCommentMutation = useAddComment(taskId);

  const handleAddComment = (data) => {
    addCommentMutation.mutate(data.content, {
      onSuccess: () => {
        reset();
      },
    });
  };

  if (isLoading) {
    return <div className="text-gray-400 text-sm mt-4">Loading details...</div>;
  }

  // Helper to format history
  const getHistoryIcon = (action) => {
    if (action.includes("CREATE")) return <Plus size={14} className="text-green-600" />;
    if (action.includes("DELETE")) return <AlertCircle size={14} className="text-red-600" />;
    if (action.includes("UPDATE")) return <Edit size={14} className="text-blue-600" />;
    return <History size={14} className="text-gray-500" />;
  };

  const formatHistoryDetails = (details) => {
    // Example: "assigned_to_id: None -> 4"
    if (details.includes("assigned_to_id")) {
      // Extract IDs
      const match = details.match(/assigned_to_id: (.*) -> (.*)/);
      if (match) {
        const [_, from, to] = match;
        const fromName =
          from === "None"
            ? "Unassigned"
            : users.find((u) => u.id === parseInt(from))?.username || from;
        const toName =
          to === "None"
            ? "Unassigned"
            : users.find((u) => u.id === parseInt(to))?.username || to;
        return (
          <span>
            Changed assignee from <strong>{fromName}</strong> to{" "}
            <strong>{toName}</strong>
          </span>
        );
      }
    }
    if (details.includes("status")) {
      const match = details.match(/status: (.*) -> (.*)/);
      if (match) {
        const [_, from, to] = match;
        return (
          <span>
            Changed status from <strong className="uppercase">{from}</strong> to{" "}
            <strong className="uppercase">{to}</strong>
          </span>
        );
      }
    }
    // Fallback for simple replaces or unknown formats
    return details
      .replace("title:", "Title changed:")
      .replace("description:", "Description changed:")
      .replace("due_date:", "Due date changed:");
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex gap-4 mb-4 border-b border-gray-100">
        <button
          type="button"
          className={`flex items-center gap-2 pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "comments"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("comments")}
        >
          <MessageSquare size={14} /> Comments ({comments.length})
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("history")}
        >
          <History size={14} /> History
        </button>
      </div>

      {activeTab === "comments" && (
        <div>
          <div className="max-h-60 overflow-y-auto mb-4 space-y-3 custom-scrollbar">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    <User size={12} className="text-gray-400" />
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
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                placeholder="Add a comment..."
                rows="1"
                {...register("content")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(handleAddComment)();
                  }
                }}
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
              disabled={addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "history" && (
        <div className="max-h-60 overflow-y-auto space-y-0 relative">
          {/* Vertical Line */}
          {history.length > 0 && (
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200 z-0"></div>
          )}

          {history.map((h) => (
            <div key={h.id} className="relative z-10 flex gap-4 pl-0 py-3 group">
              <div className="w-5 h-5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-blue-400 transition-colors">
                {getHistoryIcon(h.action)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-snug">
                  {formatHistoryDetails(h.details)}
                </p>
                <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                  <span>{new Date(h.created_at).toLocaleString()}</span>
                  <span className="font-mono text-[10px] bg-gray-100 px-1 rounded text-gray-500 uppercase tracking-wider">
                    {h.action.split(":")[0]}
                  </span>
                </div>
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
