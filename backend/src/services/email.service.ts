import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
      console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
      return;
    }
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || "noreply@hst-erp.local",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
  await sendEmail(
    to,
    "Password Reset Request",
    `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this email.</p>`,
  );
}

export async function sendNotificationEmail(to: string, title: string, body: string) {
  await sendEmail(to, title, `<p>${body}</p>`);
}
