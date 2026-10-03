import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, isSafeOwnerId } from '../../src/config/security.ts';

export type UserRole = 'yonetici' | 'avukat' | 'stajyer';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  sicilNo: string;
  baroAdi: string;
  role: UserRole;
  /** 'lawyer' = avukat oturumu, 'admin' = Adminatör oturumu */
  kind: 'lawyer' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const VALID_ROLES: UserRole[] = ['yonetici', 'avukat', 'stajyer'];

/**
 * Bearer JWT'yi doğrular ve AuthenticatedUser üretir.
 * Kimlik YALNIZCA imzalı token'dan gelir; istemci header/query parametreleri
 * (x-user-sicil, x-user-role, ?userSicilNo= vb.) kesinlikle dikkate alınmaz.
 */
export function resolveUserFromToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;

    // Adminatör token'ı: { id, username, role }
    if (decoded.username && !decoded.sicilNo) {
      const adminId = `ADMIN_${String(decoded.username).replace(/[^A-Za-z0-9_.-]/g, '')}`;
      if (!isSafeOwnerId(adminId)) return null;
      return {
        id: String(decoded.id || adminId),
        fullName: String(decoded.username),
        sicilNo: adminId,
        baroAdi: 'Sistem Yönetimi',
        role: 'yonetici',
        kind: 'admin'
      };
    }

    // Avukat token'ı: { id, sicilNo, fullName, role? }
    if (decoded.sicilNo && isSafeOwnerId(String(decoded.sicilNo))) {
      const role: UserRole = VALID_ROLES.includes(decoded.role) ? decoded.role : 'yonetici';
      return {
        id: String(decoded.id || `usr-${decoded.sicilNo}`),
        fullName: String(decoded.fullName || ''),
        sicilNo: String(decoded.sicilNo),
        baroAdi: String(decoded.baroAdi || ''),
        role,
        kind: 'lawyer'
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function extractBearer(req: Request): string | null {
  const h = req.headers['authorization'];
  if (typeof h === 'string' && h.startsWith('Bearer ')) return h.slice(7).trim() || null;
  return null;
}

/** Oturum zorunlu: geçerli token yoksa 401. */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  const user = token ? resolveUserFromToken(token) : null;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_REQUIRED',
      message: 'Bu işlem için geçerli bir oturum gereklidir. Lütfen giriş yapınız.'
    });
  }
  req.user = user;
  next();
}

/**
 * RBAC Yetkilendirme Middleware'i (imzalı JWT tabanlı)
 * Yönetici Avukat (Partner): Tüm yetkiler (Finans, Personel, AI, Dava)
 * Avukat (Associate): Dava, Müvekkil, AI, Dilekçe (Hassas Büro Bilançosu Gizli)
 * Stajyer (Paralegal): Dava evrakı okuma, Celse takvimi, AI arama (Finans ve Dava silme kapalı)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const proceed = () => {
      const role = req.user!.role;
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          error: 'RBAC_ACCESS_DENIED',
          message: `Bu işlem için yetkiniz yetersizdir. Gerekli rol: [${allowedRoles.join(', ')}], Mevcut rolünüz: [${role}]`
        });
      }
      next();
    };

    if (req.user) return proceed();
    authenticate(req, res, () => proceed());
  };
}
