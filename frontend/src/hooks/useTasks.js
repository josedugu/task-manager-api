import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { toast } from "sonner";

// Keys
export const taskKeys = {
  all: ["tasks"],
  lists: () => [...taskKeys.all, "list"],
  list: (status) => [...taskKeys.lists(), { status }],
  details: () => [...taskKeys.all, "detail"],
  detail: (id) => [...taskKeys.details(), id],
  comments: (id) => [...taskKeys.detail(id), "comments"],
  history: (id) => [...taskKeys.detail(id), "history"],
};

// -- Queries --

export function useTasks(statusFilter) {
  return useQuery({
    queryKey: taskKeys.list(statusFilter),
    queryFn: () => taskService.getAll(statusFilter || null),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTaskDetails(taskId) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async () => {
      const [comments, history] = await Promise.all([
        taskService.getComments(taskId),
        taskService.getHistory(taskId),
      ]);
      return { comments, history };
    },
    enabled: !!taskId,
  });
}

// -- Mutations --

export function useCreateTask(onSuccessCallback) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => taskService.create(data),
    onSuccess: () => {
      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: () => toast.error("Error creating task"),
  });
}

export function useUpdateTask(onSuccessCallback) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => taskService.update(data.id, data.payload),
    onSuccess: () => {
      toast.success("Task updated successfully");
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: () => toast.error("Error updating task"),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskService.delete(id),
    onSuccess: () => {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: () =>
      toast.error("Error deleting task (Only Owner/Creator can delete)"),
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => taskService.update(id, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: () => toast.error("Failed to update status"),
  });
}

export function useAddComment(taskId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content) => taskService.addComment(taskId, content),
    onSuccess: () => {
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error("Failed to add comment"),
  });
}
