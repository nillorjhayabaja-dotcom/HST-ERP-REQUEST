import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestList, type RequestListItem } from "@/components/requests/request-list";
import {
  RequestDetailsDrawer,
  type RequestDetailField,
} from "@/components/requests/request-details-drawer";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/employee-portal/my-requests")({
  ssr: false,
  component: MyRequestsPage,
});

const MODULE_TABS = [
  { value: "all", label: "All" },
  { value: "gate-pass", label: "Gate Pass" },
  { value: "leave", label: "Leave" },
  { value: "mrf", label: "MRF" },
  { value: "purchase-requests", label: "Purchase Req." },
  { value: "assets", label: "Assets" },
  { value: "visitors", label: "Visitors" },
  { value: "vehicles", label: "Vehicles" },
];

function MyRequestsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch all requests - this would need to be aggregated from multiple endpoints
  // For now we fetch gate-passes as the primary example
  const { data: gatePasses, isLoading: gpLoading } = useQuery({
    queryKey: ["my-requests", "gate-pass"],
    queryFn: async () => {
      const res = await apiClient.get("/gate-passes?my=true&limit=50");
      return (res.data as any)?.gatePasses || [];
    },
  });

  // Fetch all requests from a unified endpoint if available
  const { data: unifiedRequests, isLoading: unifiedLoading } = useQuery({
    queryKey: ["my-requests", "unified"],
    queryFn: async () => {
      const res = await apiClient.get("/requests/my?limit=50");
      return (res.data as any)?.requests || null;
    },
    retry: false,
  });

  // Build items from either unified endpoint or per-module
  const allItems: RequestListItem[] = (() => {
    if (unifiedRequests) {
      return unifiedRequests.map((r: any) => ({
        id: r.id,
        control_number: r.control_number,
        module: r.module,
        title: r.title || r.purpose || "Request",
        status: r.status,
        priority: r.priority || "normal",
        created_at: r.created_at,
        updated_at: r.updated_at,
        summary: r.summary || "",
      }));
    }

    // Fallback: aggregate from gate passes only
    return (gatePasses || []).map((gp: any) => ({
      id: gp.id,
      control_number: gp.control_number,
      module: "gate-pass",
      title: gp.purpose || "Gate Pass",
      status: gp.status,
      priority: gp.priority || "normal",
      created_at: gp.created_at,
      updated_at: gp.updated_at,
      summary: `${gp.destination || ""} · ${gp.departure_date || ""}`,
    }));
  })();

  const isLoading = unifiedLoading || gpLoading;

  // Filter by module tab
  const filteredItems =
    activeTab === "all" ? allItems : allItems.filter((i) => i.module === activeTab);

  // Detail drawer for selected request
  const { data: selectedDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["request-detail", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      // Try to get detail from gate-passes first
      const res = await apiClient.get(`/gate-passes/${selectedId}`);
      return res.data as any;
    },
    enabled: !!selectedId,
    retry: false,
  });

  const detailFields: RequestDetailField[] = selectedDetail
    ? [
        { label: "Module", value: "Gate Pass" },
        { label: "Type", value: selectedDetail.gate_pass_type?.name || "N/A" },
        { label: "Destination", value: selectedDetail.destination || "N/A" },
        { label: "Purpose", value: selectedDetail.purpose || "N/A" },
        { label: "Passengers", value: String(selectedDetail.passenger_count || 1) },
        { label: "Vehicle", value: selectedDetail.vehicle_info || "N/A" },
        { label: "Departure", value: selectedDetail.departure_date || "N/A" },
        { label: "Return", value: selectedDetail.expected_return_date || "N/A" },
      ]
    : [];

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader title="My Requests" description="All requests you created across modules" />

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap justify-start">
            {MODULE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <RequestList
              items={filteredItems}
              isLoading={isLoading}
              onItemClick={(item) => setSelectedId(item.id)}
              onRefresh={() => {
                queryClient.invalidateQueries({ queryKey: ["my-requests"] });
                queryClient.invalidateQueries({ queryKey: ["gate-passes"] });
              }}
              emptyMessage={`No ${activeTab === "all" ? "" : activeTab + " "}requests found`}
              emptyDescription="Create a new request to get started."
            />
          </TabsContent>
        </Tabs>
      </div>

      <RequestDetailsDrawer
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title={selectedDetail?.purpose || "Request Details"}
        controlNumber={selectedDetail?.control_number || ""}
        status={selectedDetail?.status || "draft"}
        priority={selectedDetail?.priority || "normal"}
        module="gate-pass"
        fields={detailFields}
        approvalSteps={selectedDetail?.approval_steps}
        comments={selectedDetail?.comments}
        attachments={selectedDetail?.attachments}
        requestId={selectedId || ""}
        requestType="gate-passes"
        isLoading={detailLoading}
      />
    </div>
  );
}
