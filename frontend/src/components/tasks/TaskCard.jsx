import { Edit, Trash2, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TaskDetails from "./TaskDetails";

export default function TaskCard({
  task,
  user,
  users,
  isExpanded,
  onToggleDetails,
  onEdit,
  onDelete,
  onStatusChange,
}) {
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

  // Status colors mapping
  const statusColors = {
    todo: "secondary",      // Grey
    in_progress: "default", // Black/Primary
    done: "outline"         // White with border
  };

  // Native Select Styles matching shadcn Input
  const selectStyles = "flex h-8 w-28 items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {task.title || "Untitled Task"}
              {task.assigned_to_id === user.id && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">You</Badge>
              )}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs">
              {task.description || "No description provided."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-2">
        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(task.due_date)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{getAssigneeName(task.assigned_to_id)}</span>
          </div>
        </div>

        {/* Expandable Details Area */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t">
            <TaskDetails taskId={task.id} users={users} />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t bg-muted/20">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value)}
          className={`${selectStyles} w-full sm:w-28`}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <div className="flex w-full sm:w-auto justify-end items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(task)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(task.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="link"
            size="sm"
            className="h-8 text-xs px-2 ml-1"
            onClick={() => onToggleDetails(task.id)}
          >
            {isExpanded ? "Hide" : "Details"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
