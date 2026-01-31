import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function TaskCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-2">
        <div className="flex gap-4 mt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between items-center border-t bg-muted/20">
        <Skeleton className="h-8 w-28 rounded-md" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardFooter>
    </Card>
  );
}
