import { Router } from "express";
import prisma from "../config/database.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { processApprovalAction } from "../services/approval.service.js";
import { logAudit } from "../utils/audit.js";

const router = Router();

router.get("/", authenticate, requirePermission("approval_requests", "read"), async (req, res) => {
  try {
    const { module, status, requested_by, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { deleted_at: null };
    if (module) where.module = module;
    if (status) where.status = status;
    if (requested_by) where.requested_by = requested_by;
    const [requests, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          workflow: true,
          requester: { select: { id: true, full_name: true } },
          actions: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.approvalRequest.count({ where }),
    ]);
    res.json({ requests, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/:id",
  authenticate,
  requirePermission("approval_requests", "read"),
  async (req, res) => {
    try {
      const request = await prisma.approvalRequest.findUnique({
        where: { id: String(req.params.id) },
        include: {
          workflow: { include: { steps: { orderBy: { step_order: "asc" } } } },
          requester: true,
          actions: { include: { actor: { select: { id: true, full_name: true } } } },
        },
      });
      if (!request) return res.status(404).json({ error: "Request not found" });
      res.json(request);
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.post(
  "/",
  authenticate,
  requirePermission("approval_requests", "create"),
  async (req, res) => {
    try {
      const { module, entity_type, entity_id, workflow_id, notes } = req.body;
      const request = await prisma.approvalRequest.create({
        data: {
          module,
          entity_type,
          entity_id,
          workflow_id,
          notes,
          requested_by: (req as any).user?.id,
          status: "pending",
          current_step: 0,
        },
      });
      await logAudit({
        user_id: (req as any).user?.id,
        module: "approval_requests",
        action: "create",
        entity_type,
        entity_id,
        new_value: request,
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.post(
  "/:id/approve",
  authenticate,
  requirePermission("approval_requests", "update"),
  async (req, res) => {
    try {
      const { comment } = req.body;
      await processApprovalAction(
        req.params.id as string,
        "approved",
        (req as any).user?.id,
        comment,
      );
      const updated = await prisma.approvalRequest.findUnique({
        where: { id: String(req.params.id) },
      });
      res.json(updated);
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.post(
  "/:id/reject",
  authenticate,
  requirePermission("approval_requests", "update"),
  async (req, res) => {
    try {
      const { comment } = req.body;
      await processApprovalAction(
        req.params.id as string,
        "rejected",
        (req as any).user?.id,
        comment,
      );
      const updated = await prisma.approvalRequest.findUnique({
        where: { id: String(req.params.id) },
      });
      res.json(updated);
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
