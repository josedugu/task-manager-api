import { LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import TaskCard from "@/components/tasks/TaskCard";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import {
	useTasks,
	useCreateTask,
	useUpdateTask,
	useDeleteTask,
	useUpdateTaskStatus,
} from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";

export default function DashboardPage() {
	const { user, logout } = useAuth();

	// Local UI State
	const [statusFilter, setStatusFilter] = useState("");
	const [expandedTask, setExpandedTask] = useState(null);
	const [modalMode, setModalMode] = useState("create");
	const [isModalOpen, setModalOpen] = useState(false);
	const [currentTask, setCurrentTask] = useState(null);

	// Queries
	const { data: tasks = [], isLoading: isLoadingTasks, error } = useTasks(statusFilter);
	const { data: users = [] } = useUsers();

	// Mutations
	const createTaskMutation = useCreateTask(() => setModalOpen(false));
	const updateTaskMutation = useUpdateTask(() => setModalOpen(false));
	const deleteTaskMutation = useDeleteTask();
	const updateStatusMutation = useUpdateTaskStatus();

	if (error) {
		console.error("Failed to load tasks", error);
		// Note: toast.error might be called too many times if put in render.
		// React Query handles stale/caching, error stays until resolved.
	}

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
		const payload = {
			...data,
			due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
			assigned_to_id: data.assigned_to_id
				? parseInt(data.assigned_to_id, 10)
				: null,
		};

		if (modalMode === "create") {
			createTaskMutation.mutate({ ...payload, status: "todo" });
		} else {
			updateTaskMutation.mutate({ id: currentTask.id, payload });
		}
	};

	const handleDelete = (id) => {
		if (!confirm("Are you sure you want to delete this task?")) return;
		deleteTaskMutation.mutate(id);
	};

	const handleStatusChange = (task, newStatus) => {
		updateStatusMutation.mutate({ id: task.id, status: newStatus });
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
			{isLoadingTasks ? (
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
