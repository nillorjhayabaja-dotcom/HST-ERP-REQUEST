import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, DoorOpen, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/security/gate-passes/today")({
  component: TodayGatePasses,
});

function TodayGatePasses() {
  const [search, setSearch] = useState("");

  const { data: gatePasses } = useQuery({
    queryKey: ["security", "gate-passes"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/gate-passes");
      if (response.error) throw new Error(response.error);
      return response.data?.data || response.data || [];
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const todayPasses = (gatePasses || []).filter((gp: any) => gp.created_at?.startsWith(today));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today's Gate Passes</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {todayPasses.length} passes today
          </Badge>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by control number, name..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Control #</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todayPasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No gate passes for today
                </TableCell>
              </TableRow>
            ) : (
              todayPasses.map((gp: any) => (
                <TableRow key={gp.id}>
                  <TableCell className="font-mono font-medium">{gp.control_number}</TableCell>
                  <TableCell>{gp.employee?.full_name || "N/A"}</TableCell>
                  <TableCell className="capitalize">
                    {gp.purpose_category?.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>{gp.trip?.destination || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={gp.status === "pending_security" ? "default" : "secondary"}>
                      {gp.status?.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      {gp.status === "pending_security" && (
                        <Button variant="default" size="sm">
                          <DoorOpen className="h-3 w-3 mr-1" /> Release
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Release</p>
              <p className="text-2xl font-bold">
                {todayPasses.filter((gp: any) => gp.status === "pending_security").length}
              </p>
            </div>
            <DoorOpen className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Released</p>
              <p className="text-2xl font-bold">
                {todayPasses.filter((gp: any) => gp.status === "released").length}
              </p>
            </div>
            <DoorOpen className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {todayPasses.filter((gp: any) => gp.status === "completed").length}
              </p>
            </div>
            <DoorOpen className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
