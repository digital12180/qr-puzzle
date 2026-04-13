import { Admin } from "../../../models/Admin.model.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../../../utils/apiError.js";
import { OtpModel } from "../../../models/Otp.model.js";
import { emailService } from "../../../services/email.service.js";




export class AdminService {
    async getProfile(AdminId: string): Promise<any> {
        try {
            console.log("🔍 [DEBUG] Getting profile for Admin ID:", AdminId);

            const admin = await Admin.findById({ _id: AdminId }).select("-password -__v");

            if (!admin) {
                console.error("❌ Admin not found for ID:", AdminId);
                throw new ApiError(404,"admin not found");
            }


            // Return profile without sensitive data
            const profile = {
                _id: admin._id.toString(),
                role: admin.role,
                email: admin.email,
                // createdAt: admin.createdAt,
                // updatedAt: admin.updatedAt
            };

            return profile;
        } catch (error: any) {
            console.error("❌ Profile fetch error:", error.message);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to fetch profile');
        }
    }

    async updateProfile(AdminId: string, updateData: any): Promise<any> {
        try {
            console.log("🔍 [DEBUG] Updating profile for Admin ID:", AdminId);
            console.log("📝 Update data:", updateData);

            // Remove sensitive fields
            // const { email } = updateData;

            // if (!email) {
            //     throw new ApiError(400, "Updated fields required")
            // }

            const admin = await Admin.findByIdAndUpdate({ _id: AdminId as string });

            if (!admin) {
                console.error("❌ Admin not found for update:", AdminId);
                throw new ApiError(404, "admin not found");
            }
            admin.email = updateData.email ?? admin.email;
            await admin.save();
            return {
                _id: admin._id.toString(),
                email: admin.email,
                role: admin.role,
                message: "profile fetched successfully1",
            };
        } catch (error: any) {
            console.error("❌ Profile update error:", error.message);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to update profile');
        }
    }
    // ==================== STEP 5: FORGOT PASSWORD ====================
    async forgotPassword(email: string) {
        if (typeof email !== "string") {
            throw new ApiError(400, "Email must be string");
        }
        const admin = await Admin.findOne({ email: email });

        if (!admin) {
            throw new ApiError(404, "Admin not found");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP (you should store in DB or Redis)
        await OtpModel.create({
            email,
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000,
        });

        await emailService.sendOtpEmail(email, otp);

        return {
            message: "OTP sent to email",
            otp: otp
        };
    }

    // ==================== STEP 6: RESET PASSWORD ====================
    async resetPassword(email: string, otp: string, newPassword: string) {

        const otpRecord = await OtpModel.findOne({ email, otp });

        if (!otpRecord) {
            throw new ApiError(400, "Invalid OTP");
        }

        if (otpRecord.expiresAt < new Date()) {
            throw new ApiError(400, "OTP expired");
        }

        // ✅ update password
        const hashed = await bcrypt.hash(newPassword, 10);

        await Admin.updateOne(
            { email },
            { password: hashed }
        );

        // ✅ delete OTP
        await OtpModel.deleteOne({ _id: otpRecord._id });

        return {
            message: "Password reset successful",
        };
    }

}