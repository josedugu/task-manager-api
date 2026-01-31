import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskCard from "@/components/tasks/TaskCard";

describe("TaskCard", () => {
  const mockUser = { id: 1, username: "testuser" };
  const mockUsers = [{ id: 1, username: "testuser" }, { id: 2, username: "otheruser" }];
  const mockTask = {
    id: 101,
    title: "Test Task",
    description: "Test Description",
    status: "todo",
    priority: "medium",
    due_date: "2023-12-31T00:00:00.000Z",
    assigned_to_id: 1,
  };

  const defaultProps = {
    task: mockTask,
    user: mockUser,
    users: mockUsers,
    isExpanded: false,
    onToggleDetails: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onStatusChange: vi.fn(),
  };

  it("renders task title and description", () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders 'Untitled Task' when title is missing", () => {
    const taskWithoutTitle = { ...mockTask, title: null };
    render(<TaskCard {...defaultProps} task={taskWithoutTitle} />);
    expect(screen.getByText("Untitled Task")).toBeInTheDocument();
  });

  it("renders 'No description provided.' when description is missing", () => {
    const taskWithoutDesc = { ...mockTask, description: null };
    render(<TaskCard {...defaultProps} task={taskWithoutDesc} />);
    expect(screen.getByText("No description provided.")).toBeInTheDocument();
  });

  it("displays 'You' badge when assigned to current user", () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("does not display 'You' badge when assigned to another user", () => {
    const otherUserTask = { ...mockTask, assigned_to_id: 2 };
    render(<TaskCard {...defaultProps} task={otherUserTask} />);
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("calls onStatusChange when status is changed", () => {
    render(<TaskCard {...defaultProps} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "in_progress" } });
    expect(defaultProps.onStatusChange).toHaveBeenCalledWith(mockTask, "in_progress");
  });
});
