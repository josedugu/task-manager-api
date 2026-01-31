import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskCard from "@/components/tasks/TaskCard";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import { Button } from "@/components/ui/button";
import {
	useTasks,
	useCreateTask,
	useUpdateTask,
	useDeleteTask,
	useUpdateTaskStatus,
} from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";

import { useAuth } from "@/context/AuthContext";
import { TaskCardSkeleton } from "@/components/tasks/TaskCardSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";

export default function TasksPage() {
	const { user } = useAuth();
	// Local UI State
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [searchInput, setSearchInput] = useState("");
	const [expandedTask, setExpandedTask] = useState(null);
	const [modalMode, setModalMode] = useState("create");
	const [isModalOpen, setModalOpen] = useState(false);
	const [currentTask, setCurrentTask] = useState(null);
	const skeletonKeys = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"];

	// Debounce search to avoid excessive API calls
	const debouncedSearch = useDebounce(searchInput, 400);

	// Queries
	const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(
		statusFilter === "ALL" ? null : statusFilter,
		debouncedSearch || null
	);
	const { data: users = [] } = useUsers();

	// Mutations
	const createTaskMutation = useCreateTask(() => setModalOpen(false));
	const updateTaskMutation = useUpdateTask(() => setModalOpen(false));
	const deleteTaskMutation = useDeleteTask();
	const updateStatusMutation = useUpdateTaskStatus();

	// Mapping for user lookup in child components
	// Passed to TaskCard/Modal as `users` array

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
		<DashboardLayout>
			<div className="flex flex-col gap-6">
				{/* Page Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
						<p className="text-muted-foreground">
							Manage your tasks and projects efficiently.
						</p>
					</div>
					<Button onClick={openCreateModal} className="gap-2">
						<Plus className="h-4 w-4" /> New Task
					</Button>
				</div>

				{/* Filters */}
				<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					{/* Search Input */}
					<div className="relative w-full sm:w-[280px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search tasks..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="pl-9 pr-9"
						/>
						{searchInput && (
							<button
								type="button"
								onClick={() => setSearchInput("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>

					{/* Status Filter */}
					<select
						className="flex h-10 w-full sm:w-[160px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="ALL">All Status</option>
						<option value="todo">To Do</option>
						<option value="in_progress">In Progress</option>
						<option value="done">Done</option>
					</select>
				</div>

				{/* Task Grid */}
				{isLoadingTasks ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{skeletonKeys.map((key) => (
							<TaskCardSkeleton key={key} />
						))}
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
							<div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
								No tasks found in this view.
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
		</DashboardLayout>
	);
}
