import { LogOut, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { taskService } from "@/services/task.service";
import { userService } from "@/services/user.service";
import TaskCard from "@/components/tasks/TaskCard";
import TaskFormModal from "@/components/tasks/TaskFormModal";

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
		setCurrentTask(null);
		setModalOpen(true);
	};

	const openEditModal = (task) => {
		setModalMode("edit");
		setCurrentTask(task);
		setModalOpen(true);
	};

	const handleModalSubmit = async (data) => {
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
				`Error ${modalMode === "create" ? "creating" : "updating"} task`
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

	const handleToggleDetails = (id) => {
		setExpandedTask(expandedTask === id ? null : id);
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
					className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
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
					className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
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
						<TaskCard
							key={task.id}
							task={task}
							user={user}
							users={users}
							isExpanded={expandedTask === task.id}
							onToggleDetails={handleToggleDetails}
							onEdit={openEditModal}
							onDelete={handleDelete}
							onStatusChange={handleStatusChange}
						/>
					))}
					{tasks.length === 0 && (
						<div className="text-center py-12 text-gray-400">
							No tasks found. Create one to get started!
						</div>
					)}
				</div>
			)}

			<TaskFormModal
				isOpen={isModalOpen}
				onClose={() => setModalOpen(false)}
				mode={modalMode}
				initialData={currentTask}
				users={users}
				onSubmit={handleModalSubmit}
			/>
		</div>
	);
}
