import { Request, Response, NextFunction } from 'express';

export type UserRole = 'yonetici' | 'avukat' | 'stajyer';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  sicilNo: string;
  baroAdi: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * RBAC Yetkilendirme Middleware'i
 * Yönetici Avukat (Partner): Tüm yetkiler (Finans, Personel, AI, Dava)
 * Avukat (Associate): Dava, Müvekkil, AI, Dilekçe (Hassas Büro Bilançosu Gizli)
 * Stajyer (Paralegal): Dava evrakı okuma, Celse takvimi, AI arama (Finans ve Dava silme kapalı)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Header veya query'den rolü oku (veya varsayılan olarak yönetici kabul et)
    const roleHeader = (req.headers['x-user-role'] as string) || (req.query.role as string) || 'yonetici';
    const userRole = (['yonetici', 'avukat', 'stajyer'].includes(roleHeader)
      ? roleHeader
      : 'yonetici') as UserRole;

    const sicilHeader = (req.headers['x-user-sicil'] as string) || '8109';
    const nameHeader = (req.headers['x-user-name'] as string) || 'Av. Osman Turgut';

    req.user = {
      id: `usr-${sicilHeader}`,
      fullName: nameHeader,
      sicilNo: sicilHeader,
      baroAdi: 'İstanbul Barosu',
      role: userRole
    };

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'RBAC_ACCESS_DENIED',
        message: `Bu işlem için yetkiniz yetersizdir. Gerekli rol: [${allowedRoles.join(', ')}], Mevcut rolünüz: [${userRole}]`
      });
    }

    next();
  };
}
