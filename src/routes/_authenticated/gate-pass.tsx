import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/gate-pass")({
  head: () => ({ meta: [{ title: "Gate Pass — HST" }] }),
  component: () => (
    <ModuleStub
      title="Gate Pass"
      module="gate_pass"
      description="Employee, material, and vehicle gate passes with QR verification and security workflow."
      features={[
        "Employee / Official Business / Personal",
        "Material In & Material Out",
        "Vehicle Gate Pass",
        "QR Code + printable slip",
        "Approval workflow",
        "Security verification & return monitoring",
      ]}
    />
  ),
});
