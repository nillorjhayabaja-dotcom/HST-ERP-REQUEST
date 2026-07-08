import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee/vehicles")({
  head: () => ({ meta: [{ title: "Vehicles — HST" }] }),
  component: () => (
    <ModuleStub
      title="Vehicle Monitoring"
      module="vehicle"
      description="Company vehicles, drivers, trips, fuel, and maintenance."
      features={["Vehicles & drivers", "Trip requests", "Fuel & mileage", "Maintenance schedule", "Trip history", "Reports"]}
    />
  ),
});
