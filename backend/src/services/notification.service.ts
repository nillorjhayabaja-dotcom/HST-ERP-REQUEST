import prisma from '../config/database.js';

export async function createNotification(data: {
  user_id: string;
  title: string;
  body?: string;
  type?: string;
  module?: string;
  reference_id?: string;
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        user_id: data.user_id,
        title: data.title,
        body: data.body,
        type: (data.type as any) || 'info',
        module: data.module,
        reference_id: data.reference_id,
        link: data.link,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function notifyRole(role: string, data: {
  title: string;
  body?: string;
  type?: string;
  module?: string;
  reference_id?: string;
  link?: string;
}) {
  try {
    const users = await prisma.userRole.findMany({
      where: { role: role as any },
      select: { user_id: true },
    });
    for (const u of users) {
      await createNotification({ user_id: u.user_id, ...data });
    }
  } catch (error) {
    console.error('Failed to notify role:', error);
  }
}