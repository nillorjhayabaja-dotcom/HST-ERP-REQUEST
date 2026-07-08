import prisma from "../config/database.js";

export interface AuditLogData {
  userId?: string;
  module: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | string[];
  userAgent?: string;
}

export const logAudit = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: data.userId,
        module: data.module,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        old_value: data.oldValue,
        new_value: data.newValue,
        ip_address: data.ipAddress
          ? Array.isArray(data.ipAddress)
            ? data.ipAddress
            : [data.ipAddress]
          : [],
        user_agent: data.userAgent,
      },
    });
  } catch (error) {
    console.error("Error logging audit:", error);
  }
};
