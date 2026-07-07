import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/mrf")({
  head: () => ({ meta: [{ title: "MRF — HST" }] }),
  component: () => (
    <ModuleStub
      title="Manufacturing Request Form (MRF)"
      module="mrf"
      description="Production, engineering, quality, and maintenance requests with configurable approvals."
      features={[
        "Production / Engineering / QA / Maintenance",
        "Attachments & comments",
        "Approval workflow",
        "Status tracking",
        "Auto-generated control number",
        "Reports & exports",
      ]}
    />
  ),
});
