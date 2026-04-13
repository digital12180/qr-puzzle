// src/models/Admin.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { AdminRole } from '../enums/index.js';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  email: string;
  password: string;
  role: AdminRole;
  validatePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(AdminRole),
    default: AdminRole.OPERATOR,
    required: true
  },
}, {
  timestamps: false
});

// Instance method
// AdminSchema.methods.validatePassword = async function (password: string): Promise<boolean> {
//   return bcrypt.compare(password, this.password);
// };

// // Pre-save middleware to hash password
// AdminSchema.pre('save', async function () {
//   if (!this.isModified('password')) return;

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   } catch (error: any) {
//     console.log(error);
//   }
// });

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);