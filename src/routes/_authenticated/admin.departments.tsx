import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/departments")({
  head: () => ({ meta: [{ title: "Departments — HST Admin" }] }),
  component: DepartmentsAdmin,
});

function DepartmentsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("departments")
        .select("*")
        .is("deleted_at", null)
        .order("code");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (values: { code: string; name: string; description?: string }) => {
      const { error } = await supabase.from("departments").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Department created");
      qc.invalidateQueries({ queryKey: ["admin-departments"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      code: String(fd.get("code")).trim().toUpperCase(),
      name: String(fd.get("name")).trim(),
      description: String(fd.get("description") ?? "").trim(),
    });
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Organizational units used across every module."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New department</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New department</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="code">Code</Label><Input id="code" name="code" required maxLength={16} /></div>
                <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required maxLength={120} /></div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" name="description" /></div>
                <DialogFooter><Button type="submit">Create</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.code}</TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.description ?? "—"}</TableCell>
                    <TableCell>{d.is_active ? "Active" : "Inactive"}</TableCell>
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
