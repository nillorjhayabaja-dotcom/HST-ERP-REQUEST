import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/leave")({
  head: () => ({ meta: [{ title: "Leave — HST" }] }),
  component: () => (
    <ModuleStub
      title="Leave Management"
      module="leave"
      description="Vacation, sick, and emergency leave with balance monitoring and calendar."
      features={["Vacation / Sick / Emergency", "Balance tracking", "Approval workflow", "Calendar view", "Reports"]}
    />
  ),
});
