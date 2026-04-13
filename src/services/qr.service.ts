// src/services/qr.service.ts
// import QRCode from 'qrcode';
// import sharp from 'sharp';

// export class QRService {
//     static async generateQRCodeBuffer(data: string): Promise<Buffer> {
//         const qrBuffer = await QRCode.toBuffer(data, {
//             width: 400,
//             margin: 2,
//             color: {
//                 dark: '#000000',
//                 light: '#FFFFFF'
//             }
//         });
//         return qrBuffer;
//     }

//     static async generateQRCode(data: string): Promise<string> {
//         const qrBuffer = await this.generateQRCodeBuffer(data);
//         const base64 = qrBuffer.toString('base64');
//         return `data:image/png;base64,${base64}`;
//     }
// }

import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
})




export class QRService {

    // ✅ Return BUFFER (best for backend processing)
    static async generateQRCodeBuffer(data: string): Promise<Buffer> {
        try {
            return await QRCode.toBuffer(data, {
                width: 400,
                margin: 2
            });
        } catch (error) {
            throw new Error('Failed to generate QR buffer');
        }
    }

    static generateQRText(puzzleId: string): string {
        // console.log("frontend usrl=------", process.env.FRONTEND_URL);
        return `${process.env.FRONTEND_URL}/scan/${puzzleId}`;
    }
}