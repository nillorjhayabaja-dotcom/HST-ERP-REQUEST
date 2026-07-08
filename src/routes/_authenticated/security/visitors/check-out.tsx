import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { UserMinus, Search, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/security/visitors/check-out")({
  component: VisitorCheckOut,
});

function VisitorCheckOut() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: visitors } = useQuery({
    queryKey: ["security", "active-visitors"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/visitors?status=checked_in");
      if (response.error) throw new Error(response.error);
      return response.data?.data || response.data || [];
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (visitorId: string) => {
      const response = await apiClient.post(`/visitors/${visitorId}/check-out`, {
        check_out_time: new Date().toISOString(),
      });
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security", "active-visitors"] });
      toast.success("Visitor checked out");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to check out");
    },
  });

  const filteredVisitors = (visitors || []).filter(
    (v: any) =>
      !search ||
      v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.company?.toLowerCase().includes(search.toLowerCase()) ||
      v.person_to_visit?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visitor Check-out</h1>
        <p className="text-muted-foreground">Check out visitors currently inside the premises</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search visitors..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Person to Visit</TableHead>
              <TableHead>Check-in Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVisitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No active visitors
                </TableCell>
              </TableRow>
            ) : (
              filteredVisitors.map((visitor: any) => (
                <TableRow key={visitor.id}>
                  <TableCell className="font-medium">{visitor.full_name}</TableCell>
                  <TableCell>{visitor.company || "-"}</TableCell>
                  <TableCell>{visitor.person_to_visit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {new Date(visitor.check_in_time).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkOutMutation.mutate(visitor.id)}
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Check Out
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-muted-foreground">Active Visitors</span>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            {filteredVisitors.length}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
