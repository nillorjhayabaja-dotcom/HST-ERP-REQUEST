import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { Search, DoorOpen, CheckCircle, User, Car, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/security/gate-passes/release")({
  component: ReleaseGatePass,
});

function ReleaseGatePass() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedPass, setSelectedPass] = useState<any>(null);
  const [securityNotes, setSecurityNotes] = useState("");

  const { data: pendingPasses } = useQuery({
    queryKey: ["security", "pending-gate-passes"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/gate-passes?status=pending_security");
      if (response.error) throw new Error(response.error);
      return response.data?.data || response.data || [];
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (gatePassId: string) => {
      const response = await apiClient.post(`/gate-passes/${gatePassId}/release`, {
        security_notes: securityNotes,
        released_at: new Date().toISOString(),
      });
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security", "pending-gate-passes"] });
      queryClient.invalidateQueries({ queryKey: ["security", "gate-passes"] });
      toast.success("Gate pass released successfully");
      setSelectedPass(null);
      setSecurityNotes("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to release gate pass");
    },
  });

  const filteredPasses = (pendingPasses || []).filter(
    (gp: any) =>
      !search ||
      gp.control_number?.toLowerCase().includes(search.toLowerCase()) ||
      gp.employee?.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRelease = () => {
    if (!selectedPass) return;
    releaseMutation.mutate(selectedPass.id);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Release Gate Pass</h1>
        <p className="text-muted-foreground">Review and release pending gate passes</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by control number or employee name..."
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No pending gate passes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPasses.map((gp: any) => (
                    <TableRow
                      key={gp.id}
                      className={selectedPass?.id === gp.id ? "bg-muted/50" : ""}
                    >
                      <TableCell className="font-mono font-medium">{gp.control_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {gp.employee?.full_name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {gp.purpose_category?.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          {gp.trip?.destination || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={selectedPass?.id === gp.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedPass(gp)}
                        >
                          {selectedPass?.id === gp.id ? "Selected" : "Select"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-4">
          {selectedPass && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Gate Pass Details
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Control #</span>
                    <span className="font-mono font-medium">{selectedPass.control_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employee</span>
                    <span>{selectedPass.employee?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department</span>
                    <span>{selectedPass.employee?.department?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose</span>
                    <span className="capitalize">
                      {selectedPass.purpose_category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destination</span>
                    <span>{selectedPass.trip?.destination || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure</span>
                    <span>
                      {selectedPass.trip?.departure_date} {selectedPass.trip?.departure_time}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Security Notes (optional)</label>
                  <Input
                    placeholder="Add any notes..."
                    value={securityNotes}
                    onChange={(e) => setSecurityNotes(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleRelease}
                  disabled={releaseMutation.isPending}
                >
                  <DoorOpen className="h-4 w-4 mr-2" />
                  {releaseMutation.isPending ? "Releasing..." : "Release Gate Pass"}
                </Button>
              </CardContent>
            </Card>
          )}

          {!selectedPass && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <DoorOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a gate pass from the list to release</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Release</span>
                <Badge variant="secondary" className="text-lg font-bold">
                  {(pendingPasses || []).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
