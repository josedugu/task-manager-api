import { api } from "../api/client";

export const taskService = {
	getAll: async (statusFilter = null, searchTerm = null) => {
		const params = new URLSearchParams();
		if (statusFilter) params.append("status", statusFilter);
		if (searchTerm) params.append("search", searchTerm);
		const query = params.toString() ? `?${params.toString()}` : "";
		return api.get(`/tasks${query}`);
	},
	getById: async (id) => {
		return api.get(`/tasks/${id}`);
	},
	create: async (taskData) => {
		return api.post("/tasks", taskData);
	},
	update: async (id, taskData) => {
		return api.patch(`/tasks/${id}`, taskData);
	},
	delete: async (id) => {
		return api.delete(`/tasks/${id}`);
	},
	// Comments
	addComment: async (taskId, content) => {
		return api.post(`/tasks/${taskId}/comments`, { content });
	},
	getComments: async (taskId) => {
		return api.get(`/tasks/${taskId}/comments`);
	},
	// History
	getHistory: async (taskId) => {
		return api.get(`/tasks/${taskId}/history`);
	},
};
