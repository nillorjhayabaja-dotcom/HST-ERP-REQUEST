import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  employee_no?: string;
  full_name: string | null;
  email: string;
  phone?: string;
  employment_status: string;
  is_active: boolean;
  department?: { name: string; code: string };
  position?: { title: string };
}

export const Route = createFileRoute("/_authenticated/employee/employees")({
  head: () => ({ meta: [{ title: "Employees — HST" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const [q, setQ] = useState("");

  const { data = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await apiClient.get<{ employees: Employee[] }>("/profiles?type=employees");
      if (response.error) throw new Error(response.error);
      return response.data?.employees ?? [];
    },
  });

  const filtered = data.filter((e) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      e.full_name?.toLowerCase().includes(s) ||
      e.email?.toLowerCase().includes(s) ||
      e.employee_no?.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Directory of all active personnel, with department, position, and status."
      />
      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, employee no…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp: Employee) => {
            const initials = (emp.full_name ?? emp.email ?? "?")
              .split(/\s+/)
              .slice(0, 2)
              .map((s) => s[0]?.toUpperCase())
              .join("");
            return (
              <Card key={emp.id}>
                <CardContent className="p-4 flex gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{emp.full_name || emp.email}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {emp.position?.title ?? "—"} · {emp.department?.name ?? "Unassigned"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{emp.email}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={emp.is_active ? "default" : "secondary"} className="text-[10px]">
                        {emp.employment_status}
                      </Badge>
                      {emp.employee_no && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {emp.employee_no}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No employees found.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
