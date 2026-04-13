// src/services/print.service.ts
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import fs from 'fs';

export class PrintService {
    static async generatePrintReadyPDF(
        piecesUrls: string[],
        outputPath: string
    ): Promise<string> {
        const doc = new PDFDocument({ size: 'A4' });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        
        // Arrange pieces randomly on page for cutting
        const positions = [
            { x: 50, y: 50 }, { x: 200, y: 50 }, { x: 350, y: 50 },
            { x: 50, y: 200 }, { x: 200, y: 200 }, { x: 350, y: 200 },
            { x: 50, y: 350 }, { x: 200, y: 350 }, { x: 350, y: 350 }
        ];
        
        for (let i = 0; i < piecesUrls.length && i < positions.length; i++) {
            doc.image(piecesUrls[i], positions[i].x, positions[i].y, {
                width: 120,
                height: 120
            });
        }
        
        doc.end();
        return outputPath;
    }
}