import type { Request, Response } from 'express';
import { Admin } from '../../../models/Admin.model.js';
import { comparePassword,hashPassword } from '../../../utils/hash.util.js';
import { generateToken } from '../../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from 'uuid';

export class AdminAuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const admin = await Admin.findOne({ email:email });

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
            console.log(error);
            
           return res.status(500).json({ message: 'Login failed', error });
        }
    }
}