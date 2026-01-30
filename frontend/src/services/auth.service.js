import { api } from "../api/client";

export const authService = {
	login: async (username, password) => {
		return api.post("/auth/login", { username, password });
	},
	register: async (username, email, password) => {
		return api.post("/auth/register", { username, email, password });
	},
};
