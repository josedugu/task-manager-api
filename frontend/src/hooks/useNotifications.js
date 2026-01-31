import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { toast } from "sonner";

export const notificationKeys = {
	all: ["notifications"],
	list: (unreadOnly) => [...notificationKeys.all, { unreadOnly }],
};

export function useNotifications(unreadOnly = false) {
	return useQuery({
		queryKey: notificationKeys.list(unreadOnly),
		queryFn: () => notificationService.getAll(unreadOnly),
		staleTime: 1000 * 30,
	});
}

export function useMarkNotificationRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => notificationService.markAsRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationKeys.all });
		},
		onError: () => toast.error("Failed to mark notification as read"),
	});
}

export function useMarkAllNotificationsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => notificationService.markAllRead(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationKeys.all });
			toast.success("All notifications marked as read");
		},
		onError: () => toast.error("Failed to mark all notifications"),
	});
}
