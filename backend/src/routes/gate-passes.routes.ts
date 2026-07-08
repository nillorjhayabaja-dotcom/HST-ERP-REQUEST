import { Router } from "express";
import prisma from "../config/database.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
import {
  listGatePasses,
  getGatePass,
  createGatePass,
  updateGatePass,
  deleteGatePass,
  submitGatePass,
  approveGatePass,
  rejectGatePass,
  cancelGatePass,
  releaseGatePass,
  completeGatePass,
  printGatePass,
  dashboardGatePasses,
  recentActivities,
  analyticsGatePasses,
  listGatePassTypes,
} from "../controllers/gate-passes.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Gate Pass Types
router.get("/types", requirePermission("gate_passes", "read"), listGatePassTypes);

// Dashboard Activities & Analytics
router.get("/dashboard/stats", requirePermission("gate_passes", "read"), dashboardGatePasses);
router.get("/activities", requirePermission("gate_passes", "read"), recentActivities);
router.get("/analytics", requirePermission("gate_passes", "read"), analyticsGatePasses);

// CRUD operations
router.post("/", requirePermission("gate_passes", "create"), createGatePass);
router.get("/", requirePermission("gate_passes", "read"), listGatePasses);
router.get("/:id", requirePermission("gate_passes", "read"), getGatePass);
router.put("/:id", requirePermission("gate_passes", "update"), updateGatePass);
router.delete("/:id", requirePermission("gate_passes", "delete"), deleteGatePass);

// Workflow actions
router.post("/:id/submit", requirePermission("gate_passes", "update"), submitGatePass);
router.post("/:id/approve", requirePermission("gate_passes", "update"), approveGatePass);
router.post("/:id/reject", requirePermission("gate_passes", "update"), rejectGatePass);
router.post("/:id/cancel", requirePermission("gate_passes", "update"), cancelGatePass);
router.post("/:id/release", requirePermission("gate_passes", "update"), releaseGatePass);
router.post("/:id/complete", requirePermission("gate_passes", "update"), completeGatePass);
router.post("/:id/print", requirePermission("gate_passes", "update"), printGatePass);

// QR Code (legacy route kept for security UI - returns a printable payload)
router.post("/:id/qr-code", requirePermission("gate_passes", "read"), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const gp = await prisma.gatePass.findUnique({ where: { id } });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });
    res.json({
      qr_data: JSON.stringify({ id: gp.id, control_number: gp.control_number }),
      control_number: gp.control_number,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

// QR Code Verification (security gate scanner)
router.post("/verify-qr", requirePermission("gate_passes", "read"), async (req, res) => {
  try {
    const { qr_data } = req.body;
    if (!qr_data) return res.status(400).json({ error: "QR code data is required" });

    let qrData: any;
    try {
      qrData = JSON.parse(qr_data);
    } catch {
      return res.status(400).json({ error: "Invalid QR code format" });
    }

    const gatePass = await prisma.gatePass.findUnique({
      where: { id: qrData.id },
      include: { employee: true, gate_pass_type: true },
    });
    if (!gatePass)
      return res.status(404).json({ error: "Invalid Pass", message: "Gate pass not found" });
    if (gatePass.deleted_at)
      return res
        .status(404)
        .json({ error: "Invalid Pass", message: "Gate pass has been cancelled" });
    if (gatePass.status === "rejected")
      return res.status(400).json({ error: "Rejected", message: "Gate pass has been rejected" });
    if (gatePass.status === "cancelled")
      return res.status(400).json({ error: "Cancelled", message: "Gate pass has been cancelled" });
    if (gatePass.status === "expired")
      return res.status(400).json({ error: "Expired", message: "Gate pass has expired" });
    if (gatePass.status === "completed")
      return res
        .status(400)
        .json({ error: "Already Used", message: "Gate pass has already been used" });
    if (gatePass.status !== "approved" && gatePass.status !== "released") {
      return res
        .status(400)
        .json({ error: "Invalid Status", message: `Gate pass status is: ${gatePass.status}` });
    }

    res.json({ valid: true, gate_pass: gatePass });
  } catch (err: any) {
    console.error("Error verifying QR code:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
