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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Shield, UserPlus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

interface UserWithRoles {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  employee_no?: string;
  is_active: boolean;
  department?: { id: string; name: string; code: string } | null;
  position?: { id: string; title: string } | null;
  user_roles: { id: string; role: string }[];
}

function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await apiClient.get<UserWithRoles[]>("/profiles?include_roles=true");
      if (response.error) throw new Error(response.error);
      return response.data || [];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await apiClient.get<any[]>("/departments");
      return response.data || [];
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiClient.post("/roles", { user_id: userId, role });
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role assigned successfully");
      setShowRoleDialog(null);
      setSelectedRole("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiClient.delete(`/roles/${roleId}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role removed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredUsers = users?.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.employee_no?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.full_name || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">{user.employee_no}</div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department?.name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.user_roles.map((ur) => (
                        <Badge key={ur.id} variant="secondary" className="text-xs">
                          {ROLE_LABELS[ur.role] || ur.role}
                          <button
                            className="ml-1 hover:text-destructive"
                            onClick={() => removeRoleMutation.mutate(ur.id)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setShowRoleDialog(user.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={!!showRoleDialog} onOpenChange={(open) => { if (!open) setShowRoleDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>Select a role to assign to this user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(ROLE_GROUPS).map(([key, group]) => (
              <div key={key}>
                <h4 className="text-sm font-medium mb-2">{group.label}</h4>
                <div className="flex flex-wrap gap-2">
                  {group.roles.map((role) => (
                    <Button
                      key={role}
                      variant={selectedRole === role ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRole(role)}
                    >
                      {ROLE_LABELS[role]}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedRole || !showRoleDialog}
              onClick={() => {
                if (showRoleDialog && selectedRole) {
                  assignRoleMutation.mutate({ userId: showRoleDialog, role: selectedRole });
                }
              }}
            >
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}