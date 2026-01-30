import { z } from "zod";

export const taskSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "Title is required")
		.max(100, "Title must be less than 100 characters"),
	description: z.string().trim().optional(),
	due_date: z.string().optional().or(z.literal("")),
	assigned_to_id: z.string().optional().or(z.literal("")),
});
