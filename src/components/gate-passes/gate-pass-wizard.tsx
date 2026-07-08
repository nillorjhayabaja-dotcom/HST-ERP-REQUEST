import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { RequestWizard, type WizardStep } from "@/components/requests/request-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Users, FileText, Clock, Car } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { RequestDetailField } from "@/components/requests/request-details-drawer";
import { RequestDetailsDrawer } from "@/components/requests/request-details-drawer";
import { StatusBadge, PriorityBadge } from "@/components/requests/status-badge";

const STEPS: WizardStep[] = [
  { id: "type", title: "Gate Pass Type", description: "Select the type of gate pass you need." },
  { id: "details", title: "Trip Details", description: "Provide details about your trip." },
  { id: "schedule", title: "Schedule", description: "Set departure and return dates." },
  {
    id: "review",
    title: "Review & Submit",
    description: "Verify all information before submitting.",
  },
];

interface GatePassFormData {
  gate_pass_type_id: string;
  purpose: string;
  destination: string;
  remarks: string;
  passenger_count: number;
  vehicle_info: string;
  departure_date: string;
  expected_return_date: string;
  priority: string;
}

const INITIAL_DATA: GatePassFormData = {
  gate_pass_type_id: "",
  purpose: "",
  destination: "",
  remarks: "",
  passenger_count: 1,
  vehicle_info: "",
  departure_date: "",
  expected_return_date: "",
  priority: "normal",
};

interface GatePassWizardProps {
  onComplete?: () => void;
}

export function GatePassWizard({ onComplete }: GatePassWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<GatePassFormData>(INITIAL_DATA);

  const { data: types } = useQuery({
    queryKey: ["gate-pass-types"],
    queryFn: async () => {
      const res = await apiClient.get("/gate-passes/types");
      return (res.data as any)?.types || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GatePassFormData) => {
      const res = await apiClient.post("/gate-passes", data);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gate-passes"] });
      toast.success("Gate pass request submitted");
      onComplete?.();
      navigate({ to: "/employee-portal/gate-passes" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit");
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: GatePassFormData) => {
      const res = await apiClient.post("/gate-passes/draft", data);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gate-passes"] });
      toast.success("Draft saved");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save draft");
    },
  });

  const updateField = <K extends keyof GatePassFormData>(key: K, value: GatePassFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(formData);
  };

  const selectedType = types?.find((t: any) => t.id === formData.gate_pass_type_id);

  return (
    <RequestWizard
      steps={STEPS}
      currentStep={step}
      onStepChange={setStep}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
      isSaving={saveDraftMutation.isPending}
    >
      {/* Step 1: Type */}
      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label>Gate Pass Type</Label>
          <Select
            value={formData.gate_pass_type_id}
            onValueChange={(v) => updateField("gate_pass_type_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gate pass type" />
            </SelectTrigger>
            <SelectContent>
              {types?.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => updateField("priority", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Step 2: Details */}
      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label>Purpose</Label>
          <Textarea
            placeholder="Describe the purpose of your trip..."
            value={formData.purpose}
            onChange={(e) => updateField("purpose", e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Destination</Label>
          <Input
            placeholder="Where are you going?"
            value={formData.destination}
            onChange={(e) => updateField("destination", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Passenger Count</Label>
          <Input
            type="number"
            min={1}
            value={formData.passenger_count}
            onChange={(e) => updateField("passenger_count", parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label>Vehicle Info (optional)</Label>
          <Input
            placeholder="e.g. Toyota HiAce - ABC1234"
            value={formData.vehicle_info}
            onChange={(e) => updateField("vehicle_info", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Remarks (optional)</Label>
          <Textarea
            placeholder="Any additional notes..."
            value={formData.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Step 3: Schedule */}
      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label>Departure Date</Label>
          <Input
            type="date"
            value={formData.departure_date}
            onChange={(e) => updateField("departure_date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Expected Return Date (optional)</Label>
          <Input
            type="date"
            value={formData.expected_return_date}
            onChange={(e) => updateField("expected_return_date", e.target.value)}
          />
        </div>
      </div>

      {/* Step 4: Review */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">Type</span>
              <p className="text-sm font-medium">{selectedType?.name || "Not selected"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                Priority
              </span>
              <p className="text-sm">
                <PriorityBadge priority={formData.priority} />
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                Purpose
              </span>
              <p className="text-sm">{formData.purpose || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                Destination
              </span>
              <p className="text-sm">{formData.destination || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                Passengers
              </span>
              <p className="text-sm">{formData.passenger_count}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                Vehicle
              </span>
              <p className="text-sm">{formData.vehicle_info || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                Departure
              </span>
              <p className="text-sm">{formData.departure_date || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                Return
              </span>
              <p className="text-sm">{formData.expected_return_date || "—"}</p>
            </div>
            {formData.remarks && (
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase text-muted-foreground font-medium">
                  Remarks
                </span>
                <p className="text-sm">{formData.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequestWizard>
  );
}
