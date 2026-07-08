import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, RefreshCw, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employee-portal/gate-passes")({
  component: GatePassPage,
});

interface GatePass {
  id: string;
  control_number: string;
  purpose_category: string;
  status: string;
  created_at: string;
  trip?: {
    destination: string;
    departure_date: string;
    departure_time: string;
  };
}

function GatePassPage() {
  const { data: gatePasses } = useQuery<GatePass[]>({
    queryKey: ["gate-passes"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/gate-passes");
      if (response.error) throw new Error(response.error);
      return response.data?.data || response.data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending_supervisor: "secondary",
      pending_manager: "secondary",
      pending_gad: "secondary",
      pending_security: "default",
      released: "default",
      completed: "default",
      rejected: "destructive",
      cancelled: "outline",
    };
    return variants[status] || "outline";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gate Pass Management</h1>
          <p className="text-muted-foreground mt-1">View and manage gate pass requests</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Gate Pass
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              All Status
            </Button>
            <Button variant="outline" className="gap-2">
              All Departments
            </Button>
            <Button variant="outline" className="gap-2">
              All Types
            </Button>
            <Button variant="outline" className="gap-2">
              All Priorities
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gate Passes List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Gate Pass Requests</CardTitle>
          <CardDescription>All gate pass requests in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {gatePasses && gatePasses.length > 0 ? (
            <div className="space-y-3">
              {gatePasses.map((gp) => (
                <div
                  key={gp.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/20 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium text-sm">{gp.control_number}</p>
                        <Badge variant={getStatusBadge(gp.status)} className="text-xs">
                          {gp.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {gp.purpose_category.replace(/_/g, " ")} • {gp.trip?.destination || "N/A"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(gp.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No Gate Pass Requests Found</p>
              <p className="text-xs text-muted-foreground mt-1">
                No gate pass requests available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}