import crypto from 'crypto';

export const generateSecureId = (length: number = 15): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const bytes = crypto.randomBytes(length);

    let result = '';

    for (let i = 0; i < bytes.length; i++) {
        const b: number = bytes[i] as number; // always defined
        result += chars[b % chars.length];
    }

    return result;
};