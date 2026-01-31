import { useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CanvasBlocks from "@/components/placeholder/CanvasBlocks";

export default function SettingsPage() {
	const titleRef = useRef(null);
	return (
		<DashboardLayout>
			<div className="relative h-[calc(100vh-9rem)] min-h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background/60">
				<CanvasBlocks
					className="absolute inset-0 h-full w-full pointer-events-none"
					targetRef={titleRef}
				/>
				<div className="relative z-10 flex h-full flex-col items-center justify-center text-center gap-3 px-6">
					<div
						ref={titleRef}
						className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
					>
						Page under construction
					</div>
					<p className="text-muted-foreground text-base sm:text-lg">
						We are working on settings.
					</p>
				</div>
			</div>
		</DashboardLayout>
	);
}
