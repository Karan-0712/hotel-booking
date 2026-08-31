import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getUserProfile } from '../db/queries.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & { role?: string };
  isAdmin?: boolean;
}

export const ADMIN_MASTER_CREDENTIALS = {
  email: 'admin@grandimperialpalace.in',
  password: 'ImperialAdmin',
  masterKey: 'ImperialAdmin',
  allowedAdminEmails: ['admin@grandimperialpalace.in', 'davekaran2006@gmail.com', 'admin@palace.com'],
};

// In-memory sets of active admin and user session tokens
export const activeAdminTokens = new Set<string>();
export const activeUserSessions = new Map<string, { uid: string; email: string; name: string; role: string }>();

// Helper to create stateless, restart-resilient local session tokens
export function createLocalSessionToken(data: { uid: string; email: string; name: string; role: string }): string {
  const payload = {
    ...data,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const token = `gip_sess_${encoded}`;
  activeUserSessions.set(token, data);
  if (data.role === 'admin' || data.email.toLowerCase() === 'admin@grandimperialpalace.in') {
    activeAdminTokens.add(token);
  }
  return token;
}

// Helper to decode stateless local session tokens
export function decodeLocalSessionToken(token: string): { uid: string; email: string; name: string; role: string } | null {
  if (!token || typeof token !== 'string') return null;

  // 1. Check in-memory map
  if (activeUserSessions.has(token)) {
    return activeUserSessions.get(token)!;
  }

  // 2. Decode stateless gip_sess_ token
  if (token.startsWith('gip_sess_')) {
    try {
      const b64 = token.replace('gip_sess_', '');
      const raw = Buffer.from(b64, 'base64url').toString('utf8');
      const payload = JSON.parse(raw);
      if (payload && payload.uid && payload.email && (!payload.exp || payload.exp > Date.now())) {
        const sessionData = {
          uid: payload.uid,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          role: payload.role || 'guest',
        };
        activeUserSessions.set(token, sessionData);
        if (sessionData.role === 'admin' || sessionData.email.toLowerCase() === 'admin@grandimperialpalace.in') {
          activeAdminTokens.add(token);
        }
        return sessionData;
      }
    } catch {
      return null;
    }
  }

  return null;
}

// Helper to verify if string is a plausible Firebase JWT (3 base64 dot-separated parts)
function isPlausibleJwt(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.startsWith('gip_') || token.startsWith('adm_') || token.startsWith('usr_')) return false;
  if (token === 'null' || token === 'undefined' || token.length < 20) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const adminToken = req.headers['x-admin-token'] as string;
  if (adminToken && (activeAdminTokens.has(adminToken) || adminToken === ADMIN_MASTER_CREDENTIALS.masterKey)) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    } as any;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty authorization token' });
  }

  // 1. Check if token is master admin token
  if (activeAdminTokens.has(token) || token === ADMIN_MASTER_CREDENTIALS.masterKey) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    } as any;
    return next();
  }

  // 2. Check local database session token (stateless or in-memory)
  const localSession = decodeLocalSessionToken(token);
  if (localSession) {
    req.isAdmin = localSession.role === 'admin' || localSession.email.toLowerCase() === 'admin@grandimperialpalace.in';
    req.user = {
      uid: localSession.uid,
      email: localSession.email,
      name: localSession.name,
      role: localSession.role,
    } as any;
    return next();
  }

  // 3. If token is a plausible Firebase JWT, verify with Firebase Admin
  if (isPlausibleJwt(token)) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      req.isAdmin = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.map(e => e.toLowerCase()).includes((decodedToken.email || '').toLowerCase());
      return next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token. Please sign in again.' });
    }
  }

  return res.status(401).json({ error: 'Unauthorized: Unrecognized session token format. Please sign in again.' });
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const adminToken = ((req.headers['x-admin-token'] as string) || '').trim();
  if (adminToken && (activeAdminTokens.has(adminToken) || adminToken === ADMIN_MASTER_CREDENTIALS.masterKey)) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    } as any;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      // 1. Master admin token check
      if (activeAdminTokens.has(token) || token === ADMIN_MASTER_CREDENTIALS.masterKey) {
        req.isAdmin = true;
        req.user = {
          uid: 'admin_master_uid',
          email: ADMIN_MASTER_CREDENTIALS.email,
          name: 'Palace General Manager',
          role: 'admin',
        } as any;
        return next();
      }

      // 2. Local database session token
      const localSession = decodeLocalSessionToken(token);
      if (localSession) {
        if (localSession.role === 'admin' || localSession.email.toLowerCase() === 'admin@grandimperialpalace.in') {
          req.isAdmin = true;
          req.user = {
            uid: localSession.uid,
            email: localSession.email,
            name: localSession.name,
            role: 'admin',
          } as any;
          return next();
        }
      }

      // 3. Firebase ID Token check
      if (isPlausibleJwt(token)) {
        try {
          const decodedToken = await adminAuth.verifyIdToken(token);
          req.user = decodedToken;

          const userEmail = (decodedToken.email || '').toLowerCase();
          if (ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.map(e => e.toLowerCase()).includes(userEmail)) {
            req.isAdmin = true;
            return next();
          }

          // Check DB profile role
          const profile = await getUserProfile(decodedToken.uid);
          if (profile && profile.role === 'admin') {
            req.isAdmin = true;
            return next();
          }
        } catch {
          // Token invalid or expired
        }
      }
    }
  }

  return res.status(403).json({ error: 'Forbidden: Palace Administrator credentials required to access this resource.' });
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const adminToken = req.headers['x-admin-token'] as string;
  if (adminToken && (activeAdminTokens.has(adminToken) || adminToken === ADMIN_MASTER_CREDENTIALS.masterKey)) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    } as any;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      if (activeAdminTokens.has(token) || token === ADMIN_MASTER_CREDENTIALS.masterKey) {
        req.isAdmin = true;
        req.user = {
          uid: 'admin_master_uid',
          email: ADMIN_MASTER_CREDENTIALS.email,
          name: 'Palace General Manager',
          role: 'admin',
        } as any;
        return next();
      }

      const localSession = decodeLocalSessionToken(token);
      if (localSession) {
        req.isAdmin = localSession.role === 'admin' || localSession.email.toLowerCase() === 'admin@grandimperialpalace.in';
        req.user = {
          uid: localSession.uid,
          email: localSession.email,
          name: localSession.name,
          role: localSession.role,
        } as any;
        return next();
      }

      if (isPlausibleJwt(token)) {
        try {
          const decodedToken = await adminAuth.verifyIdToken(token);
          req.user = decodedToken;
          req.isAdmin = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.map(e => e.toLowerCase()).includes((decodedToken.email || '').toLowerCase());
        } catch {
          // Ignore for optional auth
        }
      }
    }
  }
  next();
};
