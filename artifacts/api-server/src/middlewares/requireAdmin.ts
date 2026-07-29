import { type NextFunction, type Request, type Response } from 'express';

/**
 * Middleware that requires the authenticated user to have role === 'admin'.
 * Returns 401 if not authenticated, 403 if authenticated but not admin.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: "ليس لديك صلاحية الوصول لهذه الصفحة" });
    return;
  }
  next();
}
