// app/middleware/auth.middleware.ts
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from 'express';
import { Admin } from "../models/Admin.model.js";
import { APIResponse } from "../utils/apiResponse.js";

// Interface for token data
export interface TokenData {
    adminId: string;
    role: number;
    roleName: string;
    user: any;
}

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            tokenData?: TokenData;
            user?: any;
        }
    }
}

// ✅ Get JWT Secret from environment (with fallbacks)
const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET;

    if (!secret) {
        console.warn('⚠️ JWT_SECRET not found in environment. Using fallback secret for development.');
        return 'development-fallback-secret-2024-change-in-production';
    }

    return secret;
};

// ✅ Get JWT Refresh Secret from environment
const getJwtRefreshSecret = (): string => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.ULTRA_SECRET_KEY;

    if (!secret) {
        console.warn('⚠️ JWT_REFRESH_SECRET not found. Using JWT secret for refresh.');
        return getJwtSecret();
    }

    return secret;
};

// ✅ Token Generate Function - FIXED
export const generateToken = async (
    user: any,
    expiresIn: string = "7d"
): Promise<string> => {

    console.log("user----------------",user);
    
    const userId = user._id || user.id;

//    console.log(user);
   
    if (!userId) {
        throw new Error("User ID is required");
    }
   console.log("role - token",user.role);
   
    const payload = {
        adminId: userId.toString(),
        role: user.role,
        email: user.email || "",
    };
  
    const jwtSecret = getJwtSecret();
//   console.log(jwtSecret);
    if (!jwtSecret) {
        throw new Error("JWT Secret missing");
    }

    const options = {
        expiresIn: '7d',
        algorithm: "HS256" as const,
    };

    return await jwt.sign(payload, jwtSecret, options as jwt.SignOptions);
};

// ✅ Token Verify Middleware - UPDATED
export const verifyToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        // Check for token in multiple locations
        let token: string | undefined;

        // 1. Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }

        // 2. Check cookies
        else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        // 3. Check query parameter
        else if (req.query?.token) {
            token = req.query.token as string;
        }

        if (!token) {
            return res.json(new APIResponse(false, "Token Not found"));
        }

        console.log("🔍 [DEBUG] Token found, verifying...");

        const jwtSecret = getJwtSecret();

        // Verify token
        const decoded = jwt.verify(token, jwtSecret) as any;

        console.log("🔍 [DEBUG] Token decoded:", {
            adminId: decoded.adminId,
            role: decoded.role,
        });

        // Get role name from numeric role
        const roleName = decoded.role;
        if (!roleName) {
            console.error("❌ Invalid role in token:", decoded.role);
            return res.json(new APIResponse(false, "Invalid Role"));
        }

        const user = await Admin.findById(decoded.adminId)
            .select('-password')
            .lean();

        if (!user) {
            console.error("❌ User not found for ID:", decoded.adminId);
            return res.json(new APIResponse(false, "User Not found"));
        }

        // Attach token data to request
        req.tokenData = {
            adminId: decoded.adminId,
            role: decoded.role,
            roleName: roleName,
            user: user,
        };

        // Also attach user directly to request for convenience
        req.user = user;

        next();
    } catch (error: any) {
        console.error('❌ Token Verification Error:', error.message);

        if (error.name === 'JsonWebTokenError') {
            console.error('❌ JWT Error details:', error.message);
            return res.json(new APIResponse(false, "Invalid Token"));
        }

        if (error.name === 'TokenExpiredError') {
            console.error('❌ Token expired at:', error.expiredAt);
            return res.json(new APIResponse(false, "Token expired. Please login again."));
        }

        console.error('❌ Unknown token error:', error);
        return res.json(new APIResponse(false, "Invalid Token"));
    }
};

// ✅ Role Checking Middleware
export const checkRole = (allowedRoles: string[] = []) => {
    return (req: Request, res: Response, next: NextFunction): Response | void => {
        try {
            const userRole = req.tokenData?.roleName;
            console.log("role----",userRole);
            
            if (!userRole) {
                return res.json(new APIResponse(false, "No Token"));
            }

            if (!allowedRoles.includes(userRole)) {
                console.error(`❌ Access denied. User role: ${userRole}, Allowed: ${allowedRoles}`);
                return res.json(new APIResponse(false, "Invalid Token"));
            }

            next();
        } catch (error) {
            console.error('❌ Role check error:', error);
            return res.json(new APIResponse(false, "Role Check Error"));
        }
    };
};

// ✅ Admin Only Middleware (Shortcut)
export const adminOnly = checkRole(["admin"]);
export const adminAndoperator = checkRole(["admin", "operator"]);
export const operatorOnly = checkRole(["operator"]);


// ✅ Rate Limiting Middleware (Basic)
export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req: Request, res: Response, next: NextFunction): Response | void => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        for (const [key, timestamps] of requests.entries()) {
            requests.set(
                key,
                timestamps.filter((timestamp: number) => timestamp > windowStart)
            );
        }

        const userRequests = requests.get(ip) || [];

        if (userRequests.length >= maxRequests) {
            return res.json(new APIResponse(false, "Too many requests. Please try again later."));
        }

        userRequests.push(now);
        requests.set(ip, userRequests);

        next();
    };
};