import { Router } from 'express';
import authRoutes from './auth.routes.js';
import departmentsRoutes from './departments.routes.js';
import positionsRoutes from './positions.routes.js';
import profilesRoutes from './profiles.routes.js';
import rolesRoutes from './roles.routes.js';
import permissionsRoutes from './permissions.routes.js';
import approvalWorkflowsRoutes from './approval-workflows.routes.js';
import approvalRequestsRoutes from './approval-requests.routes.js';
import notificationsRoutes from './notifications.routes.js';
import auditLogsRoutes from './audit-logs.routes.js';
import controlNumbersRoutes from './control-numbers.routes.js';
import uploadRoutes from './upload.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import systemRoutes from './system.routes.js';
import gatePassesRoutes from './gate-passes.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/departments', departmentsRoutes);
router.use('/positions', positionsRoutes);
router.use('/profiles', profilesRoutes);
router.use('/roles', rolesRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/approval-workflows', approvalWorkflowsRoutes);
router.use('/approval-requests', approvalRequestsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/control-numbers', controlNumbersRoutes);
router.use('/upload', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);
router.use('/gate-passes', gatePassesRoutes);

export default router;
