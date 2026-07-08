import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Gate Pass data...");

  // Seed Gate Pass Types
  const gatePassTypes = await prisma.gatePassType.createMany({
    data: [
      {
        code: "OFFICIAL_BUSINESS",
        name: "Official Business",
        description: "For official company business trips",
        requires_vehicle: false,
        requires_approval: true,
      },
      {
        code: "PERSONAL",
        name: "Personal Gate Pass",
        description: "For personal errands during work hours",
        requires_vehicle: false,
        requires_approval: true,
      },
      {
        code: "WITH_VEHICLE",
        name: "Official Business with Company Vehicle",
        description: "Official business using company vehicle",
        requires_vehicle: true,
        requires_approval: true,
      },
      {
        code: "REQUEST_VEHICLE",
        name: "Request for Company Vehicle",
        description: "Request to use company vehicle",
        requires_vehicle: true,
        requires_approval: true,
      },
      {
        code: "MATERIAL_OUT",
        name: "Material Out",
        description: "For transporting materials out of the facility",
        requires_vehicle: false,
        requires_approval: true,
      },
      {
        code: "MATERIAL_IN",
        name: "Material In",
        description: "For receiving materials into the facility",
        requires_vehicle: false,
        requires_approval: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${gatePassTypes.count} gate pass types`);

  // Seed Control Number Settings
  const controlNumberSetting = await prisma.controlNumberSetting.upsert({
    where: { module: "gate_passes" },
    update: {},
    create: {
      module: "gate_passes",
      prefix: "GP",
      padding: 6,
      next_sequence: 1,
      format_template: "{PREFIX}-{YEAR}-{SEQUENCE}",
      year: new Date().getFullYear(),
    },
  });

  console.log("Created control number setting:", controlNumberSetting);

  // Create sample employees if they don't exist
  const sampleEmployees = await prisma.profile.findMany({
    where: {
      email: {
        in: ["john.doe@hst-tech.com", "jane.smith@hst-tech.com", "manager@hst-tech.com"],
      },
    },
  });

  if (sampleEmployees.length === 0) {
    console.log("No sample employees found. Please seed employees first.");
    return;
  }

  const employee1 = sampleEmployees[0];
  const employee2 = sampleEmployees[1] || sampleEmployees[0];

  // Create sample gate passes
  const gatePasses = await prisma.gatePass.createMany({
    data: [
      {
        control_number: "GP-2026-000001",
        gate_pass_type_id: (await prisma.gatePassType.findFirst({
          where: { code: "OFFICIAL_BUSINESS" },
        }))!.id,
        employee_id: employee1.id,
        status: "approved",
        departure_date: "2026-07-08",
        departure_time: "09:00",
        expected_return_date: "2026-07-08",
        expected_return_time: "17:00",
        destination: "Client Office - Makati City",
        purpose: "Client meeting and product demonstration",
        vehicle_type: "private",
        private_vehicle_plate: "ABC-1234",
        driver_name: employee1.full_name || "John Doe",
        created_by: employee1.id,
      },
      {
        control_number: "GP-2026-000002",
        gate_pass_type_id: (await prisma.gatePassType.findFirst({
          where: { code: "WITH_VEHICLE" },
        }))!.id,
        employee_id: employee2.id,
        status: "submitted",
        departure_date: "2026-07-09",
        departure_time: "08:00",
        expected_return_date: "2026-07-09",
        expected_return_time: "18:00",
        destination: "Supplier Warehouse - Laguna",
        purpose: "Pick up raw materials",
        vehicle_type: "company",
        driver_name: employee2.full_name || "Jane Smith",
        created_by: employee2.id,
      },
      {
        control_number: "GP-2026-000003",
        gate_pass_type_id: (await prisma.gatePassType.findFirst({ where: { code: "PERSONAL" } }))!
          .id,
        employee_id: employee1.id,
        status: "draft",
        departure_date: "2026-07-10",
        departure_time: "12:00",
        expected_return_date: "2026-07-10",
        expected_return_time: "13:00",
        destination: "Bank - SM City",
        purpose: "Personal transaction",
        vehicle_type: "private",
        created_by: employee1.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${gatePasses.count} sample gate passes`);

  // Create sample status histories
  const createdGatePasses = await prisma.gatePass.findMany({
    where: {
      control_number: {
        in: ["GP-2026-000001", "GP-2026-000002", "GP-2026-000003"],
      },
    },
  });

  for (const gatePass of createdGatePasses) {
    await prisma.gatePassStatusHistory.createMany({
      data: [
        {
          gate_pass_id: gatePass.id,
          status: "draft",
          notes: "Gate pass created",
          changed_by: gatePass.created_by || "",
        },
        {
          gate_pass_id: gatePass.id,
          status: gatePass.status,
          notes: `Status changed to ${gatePass.status}`,
          changed_by: gatePass.created_by || "",
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Created status histories");

  console.log("Gate Pass seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding gate passes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
