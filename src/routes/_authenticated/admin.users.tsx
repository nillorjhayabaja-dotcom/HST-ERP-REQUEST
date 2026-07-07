import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface UserWithRoles {
  id: string;
  full_name: string | null;
  email: string;
  employment_status: string;
  is_active: boolean;
  department?: { name: string };
  roles: string[];
}

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users & Roles — HST Admin" }] }),
  component: UsersAdmin,
});

function UsersAdmin() {
  const { data = [] } = useQuery<UserWithRoles[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await apiClient.get<{ users: UserWithRoles[] }>("/profiles");
      if (response.error) throw new Error(response.error);
      return response.data?.users ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        description="Assigned personnel and their enterprise role membership."
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((u: UserWithRoles) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{u.department?.name ?? "Unassigned"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                        {u.roles.map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px] uppercase">
                            {r.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "default" : "secondary"}>{u.employment_status}</Badge>
                    </TableCell>
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
