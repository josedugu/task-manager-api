import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, LogOut, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { commentSchema } from "../schemas/comment.schema";
import { taskSchema } from "../schemas/task.schema";
import { taskService } from "../services/task.service";
import { userService } from "../services/user.service";

export default function DashboardPage() {
	const { user, logout } = useAuth();
	const [tasks, setTasks] = useState([]);
	const [users, setUsers] = useState([]); // List of users for assignment
	const [statusFilter, setStatusFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [expandedTask, setExpandedTask] = useState(null);

	// Modal State
	const [modalMode, setModalMode] = useState("create"); // create | edit
	const [isModalOpen, setModalOpen] = useState(false);
	const [currentTask, setCurrentTask] = useState(null); // Task being edited

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

	const fetchTasks = useCallback(async () => {
		setLoading(true);
		try {
			const data = await taskService.getAll(statusFilter || null);
			setTasks(data);
		} catch (error) {
			console.error("Failed to fetch tasks", error);
			toast.error("Failed to load tasks");
		} finally {
			setLoading(false);
		}
	}, [statusFilter]);

	const fetchUsers = useCallback(async () => {
		try {
			const data = await userService.getAll();
			setUsers(data);
		} catch (error) {
			console.error("Failed to fetch users", error);
		}
	}, []);

	useEffect(() => {
		fetchTasks();
		fetchUsers();
	}, [fetchTasks, fetchUsers]);

	const openCreateModal = () => {
		setModalMode("create");
		reset({
			title: "",
			description: "",
			due_date: "",
			assigned_to_id: "",
		});
		setModalOpen(true);
	};

	const openEditModal = (task) => {
		setModalMode("edit");
		setCurrentTask(task);
		reset({
			title: task.title,
			description: task.description || "",
			due_date: task.due_date ? task.due_date.split("T")[0] : "",
			assigned_to_id: task.assigned_to_id ? String(task.assigned_to_id) : "",
		});
		setModalOpen(true);
	};

	const onSubmit = async (data) => {
		try {
			const payload = {
				...data,
				due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
				assigned_to_id: data.assigned_to_id
					? parseInt(data.assigned_to_id, 10)
					: null,
			};

			if (modalMode === "create") {
				await taskService.create({ ...payload, status: "todo" });
				toast.success("Task created successfully");
			} else {
				await taskService.update(currentTask.id, payload);
				toast.success("Task updated successfully");
			}

			setModalOpen(false);
			fetchTasks();
		} catch (_error) {
			toast.error(
				`Error ${modalMode === "create" ? "creating" : "updating"} task`,
			);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this task?")) return;
		try {
			await taskService.delete(id);
			toast.success("Task deleted");
			fetchTasks();
		} catch (_error) {
			toast.error("Error deleting task (Only Owner/Creator can delete)");
		}
	};

	const handleStatusChange = async (task, newStatus) => {
		try {
			await taskService.update(task.id, { status: newStatus });
			toast.success("Status updated");
			fetchTasks();
		} catch (error) {
			console.error(error);
			toast.error("Failed to update status");
		}
	};

	const formatDueDate = (dateString) => {
		if (!dateString) return null;
		return new Date(dateString).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const getAssigneeName = (id) => {
		if (!id) return "Unassigned";
		const u = users.find((u) => u.id === id);
		return u ? u.username : "Unknown";
	};

	return (
		<div className="max-w-4xl mx-auto p-8">
			{/* Header */}
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
					<p className="text-gray-500">
						Welcome, {user?.username} ({user?.role})
					</p>
				</div>
				<button
					type="button"
					onClick={logout}
					className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
				>
					<LogOut size={16} /> Logout
				</button>
			</div>

			{/* Controls */}
			<div className="flex justify-between items-center mb-6">
				<div className="flex gap-2">
					<select
						className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="">All Status</option>
						<option value="todo">To Do</option>
						<option value="in_progress">In Progress</option>
						<option value="done">Done</option>
					</select>
				</div>
				<button
					type="button"
					className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
					onClick={openCreateModal}
				>
					<Plus size={18} /> New Task
				</button>
			</div>

			{/* Task List */}
			{loading ? (
				<div className="flex justify-center items-center py-12 text-gray-400">
					Loading tasks...
				</div>
			) : (
				<div className="flex flex-col gap-4">
					{tasks.map((task) => (
						<div
							key={task.id}
							className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
						>
							<div className="flex justify-between items-start">
								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
										{task.title}
										{task.assigned_to_id === user.id && (
											<span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
												You
											</span>
										)}
									</h3>
									<p className="text-gray-600 text-sm mb-3">
										{task.description}
									</p>

									{/* Task Meta */}
									<div className="flex gap-4 text-xs text-gray-500">
										{task.due_date && (
											<span title="Due Date">
												📅 {formatDueDate(task.due_date)}
											</span>
										)}
										<span title="Assigned To">
											👤 {getAssigneeName(task.assigned_to_id)}
										</span>
									</div>
								</div>

								<div className="flex flex-col items-end gap-3">
									<div className="flex gap-2">
										<select
											value={task.status}
											onChange={(e) => handleStatusChange(task, e.target.value)}
											className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
										>
											<option value="todo">To Do</option>
											<option value="in_progress">In Progress</option>
											<option value="done">Done</option>
										</select>

										<button
											type="button"
											className="p-1 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
											onClick={() => openEditModal(task)}
											title="Edit Task"
										>
											<Edit size={18} />
										</button>

										<button
											type="button"
											className="p-1 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
											onClick={() => handleDelete(task.id)}
											title="Delete Task"
										>
											<Trash2 size={18} />
										</button>
									</div>
									<button
										type="button"
										className="text-sm text-blue-600 hover:text-blue-800 font-medium"
										onClick={() =>
											setExpandedTask(expandedTask === task.id ? null : task.id)
										}
									>
										{expandedTask === task.id
											? "Hide Details"
											: "Show Comments & History"}
									</button>
								</div>
							</div>

							{/* Expanded Details */}
							{expandedTask === task.id && (
								<TaskDetails taskId={task.id} users={users} />
							)}
						</div>
					))}
					{tasks.length === 0 && (
						<div className="text-center py-12 text-gray-400">
							No tasks found. Create one to get started!
						</div>
					)}
				</div>
			)}

			{/* Create/Edit Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
					<div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
						<h3 className="text-xl font-bold mb-4">
							{modalMode === "create" ? "Create New Task" : "Edit Task"}
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
									onClick={() => setModalOpen(false)}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
									disabled={isSubmitting}
								>
									{modalMode === "create" ? "Create" : "Update"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

// Subcomponent for Details (Comments & History)
function TaskDetails({ taskId }) {
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

	useEffect(() => {
		const loadData = async () => {
			const [c, h] = await Promise.all([
				taskService.getComments(taskId),
				taskService.getHistory(taskId),
			]);
			setComments(c);
			setHistory(h);
		};
		loadData();
	}, [taskId]);

	const loadData = async () => {
		const [c, h] = await Promise.all([
			taskService.getComments(taskId),
			taskService.getHistory(taskId),
		]);
		setComments(c);
		setHistory(h);
	};

	const handleAddComment = async (data) => {
		try {
			await taskService.addComment(taskId, data.content);
			reset();
			loadData(); // Refresh both
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
					className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
						activeTab === "comments"
							? "border-blue-600 text-blue-600"
							: "border-transparent text-gray-500 hover:text-gray-700"
					}`}
					onClick={() => setActiveTab("comments")}
				>
					Comments ({comments.length})
				</button>
				<button
					type="button"
					className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
						activeTab === "history"
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
