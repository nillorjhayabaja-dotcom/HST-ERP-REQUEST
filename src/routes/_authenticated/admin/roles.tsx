import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ROLE_LABELS, ROLE_GROUPS } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Shield, CheckCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  component: AdminRoles,
});

interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
}

interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
  permission: Permission;
}

function AdminRoles() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("all");

  const { data: roles } = useQuery({
    queryKey: ["admin", "role-permissions"],
    queryFn: async () => {
      const response = await apiClient.get<RolePermission[]>("/permissions");
      if (response.error) throw new Error(response.error);
      return response.data || [];
    },
  });

  const { data: allPermissions } = useQuery({
    queryKey: ["permissions", "all"],
    queryFn: async () => {
      const response = await apiClient.get<Permission[]>("/permissions");
      if (response.error) throw new Error(response.error);
      return response.data || [];
    },
  });

  const togglePermissionMutation = useMutation({
    mutationFn: async ({ role, permission_id, add }: { role: string; permission_id: string; add: boolean }) => {
      if (add) {
        const response = await apiClient.post("/permissions/assign", { role, permission_id });
        if (response.error) throw new Error(response.error);
      } else {
        const existing = roles?.find(r => r.role === role && r.permission_id === permission_id);
        if (existing) {
          const response = await apiClient.delete(`/permissions/assign/${existing.id}`);
          if (response.error) throw new Error(response.error);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "role-permissions"] });
      toast.success("Permission updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Group permissions by module
  const permissionsByModule: Record<string, Permission[]> = {};
  (allPermissions || []).forEach(p => {
    if (!permissionsByModule[p.module]) permissionsByModule[p.module] = [];
    permissionsByModule[p.module].push(p);
  });

  // Get permissions assigned to selected role
  const rolePermissions = selectedRole
    ? (roles || []).filter(rp => rp.role === selectedRole).map(rp => rp.permission_id)
    : [];

  const modules = Object.keys(permissionsByModule).sort();

  const getPermissionStatus = (permissionId: string) => rolePermissions.includes(permissionId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground">Manage role-based permissions across modules</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.values(ROLE_GROUPS).flatMap(group => 
          group.roles.map(role => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRole(role)}
              className="text-xs"
            >
              {ROLE_LABELS[role]}
            </Button>
          ))
        )}
      </div>

      {selectedRole && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter permissions..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="all">All Modules</option>
              {modules.map(m => (
                <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <div className="text-sm text-muted-foreground">
              {rolePermissions.length} / {allPermissions?.length || 0} permissions
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20 text-center">Granted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(permissionsByModule)
                  .filter(([module]) => selectedModule === "all" || module === selectedModule)
                  .map(([module, perms]) => (
                    perms
                      .filter(p => !search || p.action.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
                      .map(permission => (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium capitalize">{module.replace(/_/g, ' ')}</TableCell>
                          <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{permission.action}</code></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{permission.description}</TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => togglePermissionMutation.mutate({
                                role: selectedRole,
                                permission_id: permission.id,
                                add: !getPermissionStatus(permission.id),
                              })}
                              className="transition-colors"
                            >
                              {getPermissionStatus(permission.id) ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                              )}
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                  ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!selectedRole && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a role above to view and manage its permissions</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}