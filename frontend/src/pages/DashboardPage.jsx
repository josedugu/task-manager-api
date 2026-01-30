import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, LogOut, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
			} else {
				await taskService.update(currentTask.id, payload);
			}

			setModalOpen(false);
			fetchTasks();
		} catch (_error) {
			alert(`Error ${modalMode === "create" ? "creating" : "updating"} task`);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Are you sure?")) return;
		try {
			await taskService.delete(id);
			fetchTasks();
		} catch (_error) {
			alert("Error deleting task (Only Owner/Creator can delete)");
		}
	};

	const handleStatusChange = async (task, newStatus) => {
		try {
			await taskService.update(task.id, { status: newStatus });
			fetchTasks();
		} catch (error) {
			console.error(error);
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
		<div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
			{/* Header */}
			<div
				className="flex justify-between items-center"
				style={{ marginBottom: "2rem" }}
			>
				<div>
					<h1>Task Manager</h1>
					<p style={{ color: "var(--text-muted)" }}>
						Welcome, {user?.username} ({user?.role})
					</p>
				</div>
				<button
					type="button"
					onClick={logout}
					className="btn"
					style={{ border: "1px solid #ccc" }}
				>
					<LogOut size={16} style={{ marginRight: "5px" }} /> Logout
				</button>
			</div>

			{/* Controls */}
			<div
				className="flex justify-between items-center"
				style={{ marginBottom: "1.5rem" }}
			>
				<div className="flex gap-2">
					<select
						className="input"
						style={{ width: "150px", marginBottom: 0 }}
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
					className="btn btn-primary flex items-center"
					onClick={openCreateModal}
				>
					<Plus size={18} style={{ marginRight: "5px" }} /> New Task
				</button>
			</div>

			{/* Task List */}
			{loading ? (
				<p>Loading tasks...</p>
			) : (
				<div className="flex flex-col gap-4">
					{tasks.map((task) => (
						<div key={task.id} className="card" style={{ padding: "1rem" }}>
							<div className="flex justify-between items-start">
								<div>
									<h3
										style={{
											margin: "0 0 0.5rem 0",
											display: "flex",
											alignItems: "center",
											gap: "8px",
										}}
									>
										{task.title}
										{task.assigned_to_id === user.id && (
											<span
												style={{
													fontSize: "0.7em",
													background: "#e0f2fe",
													padding: "2px 6px",
													borderRadius: "4px",
													color: "#0369a1",
												}}
											>
												You
											</span>
										)}
									</h3>
									<p
										style={{
											color: "var(--text-muted)",
											fontSize: "0.9rem",
											margin: "0 0 0.5rem 0",
										}}
									>
										{task.description}
									</p>

									{/* Task Meta */}
									<div
										className="flex gap-4"
										style={{ fontSize: "0.85rem", color: "#6b7280" }}
									>
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

								<div className="flex flex-col items-end gap-2">
									<div className="flex gap-2">
										<select
											value={task.status}
											onChange={(e) => handleStatusChange(task, e.target.value)}
											style={{ padding: "4px", borderRadius: "4px" }}
										>
											<option value="todo">To Do</option>
											<option value="in_progress">In Progress</option>
											<option value="done">Done</option>
										</select>

										<button
											type="button"
											className="btn"
											style={{ padding: "4px", color: "#6b7280" }}
											onClick={() => openEditModal(task)}
											title="Edit Task"
										>
											<Edit size={18} />
										</button>

										<button
											type="button"
											className="btn"
											style={{ color: "var(--danger)", padding: "4px" }}
											onClick={() => handleDelete(task.id)}
											title="Delete Task"
										>
											<Trash2 size={18} />
										</button>
									</div>
									<button
										type="button"
										className="btn"
										style={{
											fontSize: "0.8rem",
											color: "var(--primary)",
											padding: 0,
										}}
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
						<p style={{ textAlign: "center", color: "gray" }}>
							No tasks found.
						</p>
					)}
				</div>
			)}

			{/* Create/Edit Modal */}
			{isModalOpen && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0,0,0,0.5)",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 1000,
					}}
				>
					<div className="card" style={{ width: "450px", marginBottom: 0 }}>
						<h3>{modalMode === "create" ? "Create New Task" : "Edit Task"}</h3>
						<form onSubmit={handleSubmit(onSubmit)}>
							<label
								htmlFor="task-title"
								style={{
									display: "block",
									fontSize: "0.9em",
									marginBottom: "4px",
								}}
							>
								Title
							</label>
							<input
								id="task-title"
								className="input"
								placeholder="Task Title"
								{...register("title")}
							/>
							{errors.title && (
								<p
									style={{
										color: "red",
										fontSize: "0.8em",
										marginTop: "-5px",
										marginBottom: "10px",
									}}
								>
									{errors.title.message}
								</p>
							)}

							<label
								htmlFor="task-desc"
								style={{
									display: "block",
									fontSize: "0.9em",
									marginBottom: "4px",
								}}
							>
								Description
							</label>
							<textarea
								id="task-desc"
								className="input"
								placeholder="Description"
								rows="3"
								{...register("description")}
							/>
							{errors.description && (
								<p
									style={{
										color: "red",
										fontSize: "0.8em",
										marginTop: "-5px",
										marginBottom: "10px",
									}}
								>
									{errors.description.message}
								</p>
							)}

							<div className="flex gap-4">
								<div style={{ flex: 1 }}>
									<label
										htmlFor="task-due-date"
										style={{
											display: "block",
											fontSize: "0.9em",
											marginBottom: "4px",
										}}
									>
										Due Date
									</label>
									<input
										id="task-due-date"
										type="date"
										className="input"
										{...register("due_date")}
									/>
									{errors.due_date && (
										<p
											style={{
												color: "red",
												fontSize: "0.8em",
												marginTop: "-5px",
												marginBottom: "10px",
											}}
										>
											{errors.due_date.message}
										</p>
									)}
								</div>
								<div style={{ flex: 1 }}>
									<label
										htmlFor="task-assignee"
										style={{
											display: "block",
											fontSize: "0.9em",
											marginBottom: "4px",
										}}
									>
										Assign To
									</label>
									<select
										id="task-assignee"
										className="input"
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
										<p
											style={{
												color: "red",
												fontSize: "0.8em",
												marginTop: "-5px",
												marginBottom: "10px",
											}}
										>
											{errors.assigned_to_id.message}
										</p>
									)}
								</div>
							</div>

							<div className="flex justify-between mt-4">
								<button
									type="button"
									className="btn"
									onClick={() => setModalOpen(false)}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="btn btn-primary"
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
		} catch (error) {
			console.error("Failed to add comment", error);
		}
	};

	return (
		<div
			style={{
				marginTop: "1rem",
				borderTop: "1px solid #eee",
				paddingTop: "1rem",
			}}
		>
			<div
				className="flex gap-4"
				style={{ marginBottom: "1rem", borderBottom: "1px solid #eee" }}
			>
				<button
					type="button"
					className="btn"
					style={{
						borderBottom:
							activeTab === "comments" ? "2px solid var(--primary)" : "none",
						borderRadius: 0,
					}}
					onClick={() => setActiveTab("comments")}
				>
					Comments ({comments.length})
				</button>
				<button
					type="button"
					className="btn"
					style={{
						borderBottom:
							activeTab === "history" ? "2px solid var(--primary)" : "none",
						borderRadius: 0,
					}}
					onClick={() => setActiveTab("history")}
				>
					History
				</button>
			</div>

			{activeTab === "comments" && (
				<div>
					<div
						style={{
							maxHeight: "200px",
							overflowY: "auto",
							marginBottom: "1rem",
						}}
					>
						{comments.map((c) => (
							<div
								key={c.id}
								style={{
									background: "#f9fafb",
									padding: "0.5rem",
									borderRadius: "4px",
									marginBottom: "0.5rem",
								}}
							>
								<div className="flex justify-between items-start">
									<span style={{ fontWeight: "bold", fontSize: "0.85rem" }}>
										{c.user?.username || "Unknown"}
									</span>
									<span style={{ fontSize: "0.7em", color: "#9ca3af" }}>
										{new Date(c.created_at).toLocaleString()}
									</span>
								</div>
								<p style={{ margin: "4px 0 0 0", fontSize: "0.9rem" }}>
									{c.content}
								</p>
							</div>
						))}
					</div>
					<form
						onSubmit={handleSubmit(handleAddComment)}
						className="flex gap-2 items-start"
					>
						<div style={{ flex: 1 }}>
							<input
								className="input"
								style={{ marginBottom: 0 }}
								placeholder="Add a comment..."
								{...register("content")}
							/>
							{errors.content && (
								<p
									style={{
										color: "red",
										fontSize: "0.8em",
										marginTop: "2px",
									}}
								>
									{errors.content.message}
								</p>
							)}
						</div>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isSubmitting}
						>
							Send
						</button>
					</form>
				</div>
			)}

			{activeTab === "history" && (
				<div style={{ maxHeight: "200px", overflowY: "auto" }}>
					{history.map((h) => (
						<div
							key={h.id}
							style={{
								fontSize: "0.85rem",
								marginBottom: "0.5rem",
								borderLeft: "2px solid #ddd",
								paddingLeft: "0.5rem",
							}}
						>
							<strong>{h.action}</strong>: {h.details}
							<div style={{ color: "#9ca3af", fontSize: "0.75em" }}>
								{new Date(h.created_at).toLocaleString()}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
