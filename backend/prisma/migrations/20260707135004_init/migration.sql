-- CreateEnum
CREATE TYPE "GatePassStatus" AS ENUM ('draft', 'submitted', 'for_supervisor_approval', 'for_department_head_approval', 'for_vehicle_coordinator_approval', 'for_general_administration_approval', 'approved', 'released', 'returned', 'completed', 'rejected', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('company', 'private', 'public_transport', 'walking');

-- CreateEnum
CREATE TYPE "ApprovalActionType" AS ENUM ('approve', 'reject', 'return_for_revision');

-- CreateTable
CREATE TABLE "gate_pass_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_pass_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_passes" (
    "id" TEXT NOT NULL,
    "control_number" TEXT NOT NULL,
    "gate_pass_type_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" "GatePassStatus" NOT NULL DEFAULT 'draft',
    "departure_date" TEXT NOT NULL,
    "departure_time" TEXT NOT NULL,
    "expected_return_date" TEXT,
    "expected_return_time" TEXT,
    "actual_return_date" TEXT,
    "actual_return_time" TEXT,
    "destination" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "remarks" TEXT,
    "vehicle_type" "VehicleType" NOT NULL DEFAULT 'private',
    "company_vehicle_id" TEXT,
    "private_vehicle_plate" TEXT,
    "driver_name" TEXT,
    "driver_license" TEXT,
    "mileage_start" TEXT,
    "mileage_end" TEXT,
    "qr_code_data" TEXT,
    "qr_code_generated_at" TEXT,
    "print_count" INTEGER NOT NULL DEFAULT 0,
    "last_printed_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TEXT,
    "released_at" TEXT,
    "completed_at" TEXT,

    CONSTRAINT "gate_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_pass_approvals" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "role" "AppRole",
    "action" "ApprovalActionType",
    "comment" TEXT,
    "ip_address" JSONB,
    "user_agent" TEXT,
    "acted_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_pass_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_pass_status_history" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "status" "GatePassStatus" NOT NULL,
    "notes" TEXT,
    "changed_by" TEXT,
    "changed_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" JSONB,

    CONSTRAINT "gate_pass_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_pass_vehicles" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "driver_name" TEXT NOT NULL,
    "driver_license" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" TEXT,
    "color" TEXT,
    "mileage_start" TEXT,
    "mileage_end" TEXT,
    "trip_started_at" TEXT,
    "trip_ended_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_pass_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_pass_logs" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "ip_address" JSONB,
    "user_agent" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_pass_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_pass_attachments" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT,
    "file_size" INTEGER,
    "uploaded_by" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_pass_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_pass_print_logs" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "printed_by" TEXT,
    "printed_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printer_name" TEXT,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "ip_address" JSONB,

    CONSTRAINT "gate_pass_print_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gate_pass_types_code_key" ON "gate_pass_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "gate_passes_control_number_key" ON "gate_passes"("control_number");

-- CreateIndex
CREATE UNIQUE INDEX "gate_passes_qr_code_data_key" ON "gate_passes"("qr_code_data");

-- CreateIndex
CREATE UNIQUE INDEX "gate_pass_vehicles_gate_pass_id_key" ON "gate_pass_vehicles"("gate_pass_id");

-- AddForeignKey
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_gate_pass_type_id_fkey" FOREIGN KEY ("gate_pass_type_id") REFERENCES "gate_pass_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_approvals" ADD CONSTRAINT "gate_pass_approvals_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_approvals" ADD CONSTRAINT "gate_pass_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_status_history" ADD CONSTRAINT "gate_pass_status_history_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_vehicles" ADD CONSTRAINT "gate_pass_vehicles_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_logs" ADD CONSTRAINT "gate_pass_logs_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_logs" ADD CONSTRAINT "gate_pass_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_attachments" ADD CONSTRAINT "gate_pass_attachments_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
