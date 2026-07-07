import prisma from '../config/database.js';

export interface NotificationData {
  userId: string;
  title: string;
  body?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'approval' | 'system';
  module?: string;
  referenceId?: string;
  link?: string;
}

export const createNotification = async (data: NotificationData): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        user_id: data.userId,
        title: data.title,
        body: data.body,
        type: data.type || 'info',
        module: data.module,
        reference_id: data.referenceId,
        link: data.link,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const createBulkNotifications = async (userIds: string[], data: Omit<NotificationData, 'userId'>): Promise<void> => {
  try {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        user_id: userId,
        title: data.title,
        body: data.body,
        type: data.type || 'info',
        module: data.module,
        reference_id: data.referenceId,
        link: data.link,
      })),
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
  }
};