import { api } from "../api/client";

export const userService = {
	getAll: async () => {
		return api.get("/users");
	},
};
