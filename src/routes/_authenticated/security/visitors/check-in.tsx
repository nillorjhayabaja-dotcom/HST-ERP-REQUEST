import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserPlus, Phone, Building2, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/security/visitors/check-in")({
  component: VisitorCheckIn,
});

function VisitorCheckIn() {
  const [form, setForm] = useState({
    full_name: "",
    company: "",
    purpose: "",
    contact_number: "",
    person_to_visit: "",
    id_number: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.person_to_visit) {
      toast.error("Name and person to visit are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/visitors/check-in", {
        ...form,
        check_in_time: new Date().toISOString(),
      });
      if (response.error) throw new Error(response.error);
      
      toast.success("Visitor checked in successfully");
      setForm({
        full_name: "",
        company: "",
        purpose: "",
        contact_number: "",
        person_to_visit: "",
        id_number: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to check in visitor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Visitor Check-in</h1>
        <p className="text-muted-foreground">Register and check in visitors</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            New Visitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="ABC Corporation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ID Number</label>
                <Input
                  value={form.id_number}
                  onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                  placeholder="ID-12345"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  value={form.contact_number}
                  onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                  placeholder="+63 912 345 6789"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Person to Visit *</label>
                <Input
                  value={form.person_to_visit}
                  onChange={(e) => setForm({ ...form, person_to_visit: e.target.value })}
                  placeholder="Maria Santos"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose</label>
                <Input
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="Meeting, Delivery, etc."
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Checking in..." : "Check In Visitor"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Check-in time: {new Date().toLocaleTimeString()}
        </div>
        <Badge variant="outline">
          <Building2 className="h-3 w-3 mr-1" />
          Visitor Log Active
        </Badge>
      </div>
    </div>
  );
}