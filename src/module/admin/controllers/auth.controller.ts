import type { Request, Response, NextFunction } from 'express';
import { Admin } from '../../../models/Admin.model.js';
import { comparePassword, hashPassword } from '../../../utils/hash.util.js';
import { generateToken } from '../../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from 'uuid';
import { AdminService } from '../services/auth.service.js';
import { ApiError } from '../../../utils/apiError.js';
import { APIResponse } from '../../../utils/apiResponse.js';


export class AdminAuthController {
    private service = new AdminService();
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            const admin = await Admin.findOne({ email: email });

            if (!admin) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isValidPassword = await comparePassword(password, admin.password);

            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            const token = await generateToken(admin._id, admin.email);
            return res.json({ token, admin: { email: admin.email, role: admin.role } });
        } catch (error) {
            // console.log(error);

            // return res.status(500).json({ message: 'Login failed', error });
            next(error)
        }
    }

    logout = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            // Clear refresh token cookie
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });

            return res.json(new APIResponse(true, 'Logout successful', null));

        } catch (error) {
            next(error);
        }
    };

    getProfile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const adminId = req.user?._id || req.tokenData?.adminId;

            if (!adminId) {
                throw new ApiError(401, 'Authentication required');
            }

            const profile = await this.service.getProfile(adminId);
            return res.json(new APIResponse(true, 'Profile retrieved', profile));
        } catch (error) {
            next(error);
        }
    };

    updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const adminId = req.user?._id || req.tokenData?.adminId;

            if (!adminId) {
                throw new ApiError(401, 'Authentication required');
            }

            const profile = await this.service.updateProfile(adminId, req.body);
            return res.json(new APIResponse(true, 'Profile updated', profile));
        } catch (error) {
            next(error);
        }
    };
    // ==================== STEP 5: FORGOT PASSWORD ====================
    forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {

            const { email } = req.body;
            const result = await this.service.forgotPassword(email);

            return res.json(new APIResponse(true, result.message, result));

        } catch (error) {
            next(error);
        }
    };

    // ==================== STEP 6: RESET PASSWORD ====================
    resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { email, otp, password } = req.body;

            const result = await this.service.resetPassword(
                email,
                otp,
                password
            );

            return res.json(new APIResponse(true, result.message, null));


        } catch (error) {
            next(error);
        }
    };

}