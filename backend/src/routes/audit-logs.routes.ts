import { Router } from "express";
import prisma from "../config/database.js";
import { authenticate, requirePermission } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, requirePermission("audit_logs", "read"), async (req, res) => {
  try {
    const { module, action, entity_type, user_id, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;
    if (user_id) where.user_id = user_id;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authenticate, requirePermission("audit_logs", "read"), async (req, res) => {
  try {
    const log = await prisma.auditLog.findUnique({ where: { id: String(req.params.id) } });
    if (!log) return res.status(404).json({ error: "Audit log not found" });
    res.json(log);
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
