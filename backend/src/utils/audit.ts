import prisma from '../config/database.js';

export async function logAudit(data: {
  user_id?: string;
  module: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: data.user_id,
        module: data.module,
        action: data.action,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        old_value: data.old_value,
        new_value: data.new_value,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}