import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ClipboardList,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { apiClient } from "@/lib/api-client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HST Enterprise Portal" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();

      const response = await apiClient.get<{
        pending: number;
        approvedToday: number;
        rejectedToday: number;
        employees: number;
        unread: number;
      }>("/dashboard/stats");
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const response = await apiClient.get<Array<{ id: string; module: string; action: string; entity_type?: string | null; created_at: string }>>(
        "/dashboard/activity"
      );
      if (response.error) throw new Error(response.error);
      return response.data ?? [];
    },
  });

  const kpis = [
    { label: "Pending Approvals", value: stats?.pending ?? 0, icon: Clock, tone: "text-warning" },
    { label: "Approved Today", value: stats?.approvedToday ?? 0, icon: CheckCircle2, tone: "text-success" },
    { label: "Rejected Today", value: stats?.rejectedToday ?? 0, icon: XCircle, tone: "text-destructive" },
    { label: "Active Employees", value: stats?.employees ?? 0, icon: Users, tone: "text-primary" },
    { label: "Unread Notifications", value: stats?.unread ?? 0, icon: Bell, tone: "text-gold" },
    { label: "Open Requests", value: stats?.pending ?? 0, icon: ClipboardList, tone: "text-primary" },
  ];

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Snapshot of company activity across every enterprise module."
      />

      <div className="p-6 pt-0 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {k.label}
                  </span>
                  <k.icon className={`h-4 w-4 ${k.tone}`} />
                </div>
                <div className="text-3xl font-semibold mt-2 tabular-nums">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No activity yet. Actions across every module will appear here.
                </p>
              )}
              {recentActivity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="uppercase text-[10px]">
                      {a.module}
                    </Badge>
                    <span className="text-sm truncate">
                      {a.action} <span className="text-muted-foreground">on {a.entity_type ?? "—"}</span>
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-gold" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Database" value="Operational" ok />
              <Row label="Authentication" value="Operational" ok />
              <Row label="Approval Engine" value="Operational" ok />
              <Row label="Notifications" value="Operational" ok />
              <Row label="Audit Trail" value="Recording" ok />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ok ? "text-success" : "text-destructive"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-success" : "bg-destructive"}`} />
        {value}
      </span>
    </div>
  );
}
