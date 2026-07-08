import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee/purchase-requests")({
  head: () => ({ meta: [{ title: "Purchase Requests — HST" }] }),
  component: () => (
    <ModuleStub
      title="Purchase Requests"
      module="purchase_request"
      description="Purchase requisitions, approvals, suppliers, POs, and receiving."
      features={[
        "PR creation",
        "Approval workflow",
        "Supplier & PO",
        "Receiving",
        "Status tracking",
        "Reports",
      ]}
    />
  ),
});
