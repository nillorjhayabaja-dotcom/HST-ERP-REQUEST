import { Router } from "express";
import prisma from "../config/database.js";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

// Employee dashboard stats
router.get("/employee", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const [gatePasses, leaveRequests, mrfRequests, purchaseRequests, notifications] =
      await Promise.all([
        prisma.gatePass.count({ where: { employee_id: userId } }),
        prisma.approvalRequest.count({ where: { requested_by: userId, module: "leave" } }),
        prisma.approvalRequest.count({ where: { requested_by: userId, module: "mrf" } }),
        prisma.approvalRequest.count({
          where: { requested_by: userId, module: "purchase_request" },
        }),
        prisma.notification.count({ where: { user_id: userId, is_read: false } }),
      ]);

    res.json({
      gatePasses,
      leaveRequests,
      mrfRequests,
      purchaseRequests,
      notifications,
    });
  } catch (error) {
    console.error("Employee dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin dashboard stats - accessible by admin roles and specialized roles
router.get(
  "/admin",
  authenticate,
  requireRole(
    "super_administrator",
    "system_administrator",
    "administrator",
    "it_support",
    "hr",
    "gad",
    "internal_auditor",
  ),
  async (req, res) => {
    try {
      const [totalUsers, totalDepartments, activeRoles, pendingApprovals] = await Promise.all([
        prisma.profile.count({ where: { is_active: true } }),
        prisma.department.count({ where: { is_active: true } }),
        prisma.userRole.groupBy({ by: ["role"], _count: true }),
        prisma.approvalRequest.count({ where: { status: "pending" } }),
      ]);

      res.json({
        totalUsers,
        totalDepartments,
        activeRoles: activeRoles.length,
        pendingApprovals,
      });
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Security dashboard stats - accessible by security guards and vehicle coordinators
router.get(
  "/security",
  authenticate,
  requireRole(
    "security_guard",
    "vehicle_coordinator",
    "super_administrator",
    "system_administrator",
    "administrator",
  ),
  async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [pendingRelease, releasedToday, activeVisitors] = await Promise.all([
        prisma.gatePass.count({ where: { status: "pending_security" } as any }),
        prisma.gatePass.count({ where: { status: "released", released_at: { contains: today } } }),
        prisma.gatePass.count({ where: { status: "released", completed_at: null } }),
      ]);

      res.json({
        pendingRelease,
        releasedToday,
        activeVisitors,
      });
    } catch (error) {
      console.error("Security dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
