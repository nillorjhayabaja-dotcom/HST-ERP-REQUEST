import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/employee-portal/my-activities")({
  ssr: false,
  component: MyActivitiesPage,
});

function MyActivitiesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Activities</h1>
          <p className="text-muted-foreground mt-1 text-sm">A timeline of request updates.</p>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

