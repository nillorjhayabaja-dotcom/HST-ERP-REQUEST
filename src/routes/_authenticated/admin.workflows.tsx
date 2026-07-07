import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/workflows")({
  head: () => ({ meta: [{ title: "Approval Workflows — HST Admin" }] }),
  component: WorkflowsAdmin,
});

function WorkflowsAdmin() {
  const { data = [] } = useQuery({
    queryKey: ["admin-workflows"],
    queryFn: async () => {
      const { data } = await supabase
        .from("approval_workflows")
        .select("*, steps:approval_workflow_steps(id, step_order, name, approver_role, is_optional)")
        .is("deleted_at", null)
        .order("module");
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Approval Workflows"
        description="Configure the multi-step approval chains that every module reuses."
      />
      <div className="p-6 space-y-4">
        {data.length === 0 && (
          <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
            No workflows configured yet. Every module can share a single, versioned approval chain.
          </CardContent></Card>
        )}
        {data.map((wf) => (
          <Card key={wf.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{wf.name}</h3>
                    <Badge variant="outline">{wf.module}</Badge>
                    {wf.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  {wf.description && <p className="text-sm text-muted-foreground mt-1">{wf.description}</p>}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Step</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Approver Role</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(wf.steps ?? [])].sort((a, b) => a.step_order - b.step_order).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.step_order}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.approver_role?.replace(/_/g, " ") ?? "—"}</TableCell>
                      <TableCell>{s.is_optional ? "Optional" : "Required"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
