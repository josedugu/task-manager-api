import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { taskSchema } from "@/schemas/task.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function TaskFormModal({
  isOpen,
  onClose,
  mode, // "create" | "edit"
  initialData,
  users,
  onSubmit,
}) {
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

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        reset({
          title: initialData.title,
          description: initialData.description || "",
          due_date: initialData.due_date
            ? initialData.due_date.split("T")[0]
            : "",
          assigned_to_id: initialData.assigned_to_id
            ? String(initialData.assigned_to_id) // Keep as string for Select/Input
            : "",
        });
      } else {
        reset({
          title: "",
          description: "",
          due_date: "",
          assigned_to_id: "",
        });
      }
    }
  }, [isOpen, mode, initialData, reset]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Create New Task" : "Edit Task"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Add a new task to your project."
              : "Make changes to your task here."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Task Title"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-destructive text-xs">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Describe the task..."
              className="resize-none h-32"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                {...register("due_date")}
              />
              {errors.due_date && (
                <p className="text-destructive text-xs">
                  {errors.due_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assign To</Label>
              {/* Using native select for robustness without needing complex Select controller adapter */}
              <select
                id="task-assignee"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <p className="text-destructive text-xs">
                  {errors.assigned_to_id.message}
                </p>
              )}
            </div>
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? "Create Task" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
