import type { Request } from "express";

export function isCmsAdminEmail(email: string | null | undefined): boolean {
  const allowedEmail = process.env.CMS_ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(
    allowedEmail &&
      email &&
      email.trim().toLowerCase() === allowedEmail,
  );
}

export function isCmsAdmin(req: Request): boolean {
  return req.isAuthenticated() && isCmsAdminEmail(req.user.email);
}