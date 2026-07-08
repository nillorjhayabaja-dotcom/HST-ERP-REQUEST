import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  body?: string;
  type: string;
  module?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const Route = createFileRoute("/_authenticated/shared/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HST" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", "all"],
    queryFn: async () => {
      const response = await apiClient.get<{ notifications: Notification[] }>("/notifications?limit=100");
      if (response.error) throw new Error(response.error);
      return response.data?.notifications ?? [];
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put("/notifications/read-all");
      if (response.error) throw new Error(response.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Marked all as read");
    },
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`/notifications/${id}/read`);
      if (response.error) throw new Error(response.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System messages, approval requests, and module alerts."
        actions={
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        }
      />
      <div className="p-6 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && data.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground text-sm">
              You're all caught up.
            </CardContent>
          </Card>
        )}
        {data.map((n: Notification) => (
          <Card key={n.id} className={n.is_read ? "opacity-70" : ""}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-muted" : "bg-gold"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{n.title}</span>
                  {n.module && <Badge variant="outline" className="text-[10px] uppercase">{n.module}</Badge>}
                  <Badge variant="secondary" className="text-[10px]">{n.type}</Badge>
                </div>
                {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && (
                <Button size="sm" variant="ghost" onClick={() => markOne.mutate(n.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
