import prisma from '../config/database.js';
import { createNotification } from './notification.service.js';

export async function processApprovalAction(requestId: string, action: 'approved' | 'rejected', actorId: string, comment?: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: { workflow: { include: { steps: { orderBy: { step_order: 'asc' } } } } },
  });

  if (!request) throw new Error('Approval request not found');

  await prisma.approvalAction.create({
    data: { request_id: requestId, step_order: request.current_step, action, actor_id: actorId, comment },
  });

  if (action === 'rejected') {
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', completed_at: new Date().toISOString() },
    });
    return;
  }

  const nextStep = request.current_step + 1;
  const totalSteps = request.workflow?.steps.length || 0;

  if (nextStep >= totalSteps) {
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'approved', current_step: nextStep, completed_at: new Date().toISOString() },
    });
    await createNotification({
      user_id: request.requested_by,
      title: 'Request Approved',
      body: `Your ${request.module} request has been fully approved.`,
      type: 'approval',
      module: request.module,
      reference_id: request.id,
    });
  } else {
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'in_progress', current_step: nextStep },
    });
  }
}