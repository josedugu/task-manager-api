import { api } from "../api/client";

export const notificationService = {
	getAll: async (unreadOnly = false) => {
		const query = unreadOnly ? "?unread_only=true" : "";
		return api.get(`/notifications${query}`);
	},
	markAsRead: async (id) => {
		return api.patch(`/notifications/${id}`, {});
	},
	markAllRead: async () => {
		return api.post("/notifications/mark-all-read", {});
	},
	delete: async (id) => {
		return api.delete(`/notifications/${id}`);
	},
};
