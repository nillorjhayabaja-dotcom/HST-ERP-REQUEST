import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({ meta: [{ title: "Approvals — HST" }] }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { data = [] } = useQuery({
    queryKey: ["approvals-pending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("approval_requests")
        .select("*")
        .in("status", ["pending", "in_progress"])
        .is("deleted_at", null)
        .order("requested_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Requests awaiting your action across every module."
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requested</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                      No pending approvals in your queue.
                    </TableCell>
                  </TableRow>
                )}
                {data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-mono">{new Date(r.requested_at).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{r.module}</Badge></TableCell>
                    <TableCell className="text-sm">{r.entity_type}</TableCell>
                    <TableCell>Step {r.current_step}</TableCell>
                    <TableCell><Badge>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
