import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotifications,
} from "@/hooks/useNotifications";

const formatDateTime = (isoDate) => {
	if (!isoDate) return "";
	const date = new Date(isoDate);
	return date.toLocaleString();
};

export default function NotificationsDropdown() {
	const {
		data: notifications = [],
		isLoading,
		isError,
	} = useNotifications(true);
	const unreadCount = notifications.length;

	const markReadMutation = useMarkNotificationRead();
	const markAllReadMutation = useMarkAllNotificationsRead();

	const handleMarkRead = (notification) => {
		markReadMutation.mutate(notification.id);
	};

	const handleMarkAllRead = () => {
		if (unreadCount === 0) return;
		markAllReadMutation.mutate();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5 text-muted-foreground" />
					{unreadCount > 0 && (
						<span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="w-80" align="end">
				<DropdownMenuLabel className="flex items-center justify-between">
					<span>Notifications</span>
					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-xs"
							onClick={handleMarkAllRead}
						>
							<CheckCheck className="mr-1 h-3.5 w-3.5" />
							Mark all read
						</Button>
					)}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{isLoading && (
					<div className="px-2 py-2 text-sm text-muted-foreground">
						Loading notifications...
					</div>
				)}

				{isError && (
					<div className="px-2 py-2 text-sm text-destructive">
						Failed to load notifications.
					</div>
				)}

				{!isLoading && !isError && notifications.length === 0 && (
					<div className="px-2 py-2 text-sm text-muted-foreground">
						You have no unread notifications.
					</div>
				)}

				{!isLoading && !isError &&
					notifications.map((notification) => (
						<DropdownMenuItem
							key={notification.id}
							className="flex cursor-pointer flex-col items-start gap-1 rounded-md px-2 py-2 bg-muted/40"
							onClick={() => handleMarkRead(notification)}
						>
							<div className="flex w-full items-center justify-between gap-2">
								<span className="text-sm font-medium">
									{notification.title}
								</span>
								<Badge variant="secondary" className="text-[10px]">
									New
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground">
								{notification.message}
							</p>
							<span className="text-[10px] text-muted-foreground">
								{formatDateTime(notification.created_at)}
							</span>
						</DropdownMenuItem>
					))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
