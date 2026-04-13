// src/services/qr.service.ts
import QRCode from 'qrcode';
import sharp from 'sharp';

export class QRService {
    static async generateQRCodeBuffer(data: string): Promise<Buffer> {
        const qrBuffer = await QRCode.toBuffer(data, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrBuffer;
    }
    
    static async generateQRCode(data: string): Promise<string> {
        const qrBuffer = await this.generateQRCodeBuffer(data);
        const base64 = qrBuffer.toString('base64');
        return `data:image/png;base64,${base64}`;
    }
}