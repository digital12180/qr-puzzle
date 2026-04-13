// src/services/scramble.service.ts
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export class ScrambleService {
    static async scrambleQRCode(
        qrImageBuffer: Buffer, 
        pieces: number = 4
    ): Promise<{
        scrambledImageUrl: string;
        piecesUrls: string[];
    }> {
        // Get image dimensions
        const metadata = await sharp(qrImageBuffer).metadata();
        const width = metadata.width || 400;
        const height = metadata.height || 400;
        
        // Calculate piece dimensions
        const piecesPerRow = Math.sqrt(pieces);
        const pieceWidth = Math.floor(width / piecesPerRow);
        const pieceHeight = Math.floor(height / piecesPerRow);
        
        // Split image into pieces
        const imagePieces: Buffer[] = [];
        for (let row = 0; row < piecesPerRow; row++) {
            for (let col = 0; col < piecesPerRow; col++) {
                const piece = await sharp(qrImageBuffer)
                    .extract({
                        left: col * pieceWidth,
                        top: row * pieceHeight,
                        width: pieceWidth,
                        height: pieceHeight
                    })
                    .toBuffer();
                imagePieces.push(piece);
            }
        }
        
        // Shuffle pieces randomly
        const shuffledPieces = this.shuffleArray([...imagePieces]);
        
        // Save each piece as separate image for physical printing
        const piecesUrls: string[] = [];
        const outputDir = path.join(__dirname, '../../public/puzzles');
        await fs.mkdir(outputDir, { recursive: true });
        
        for (let i = 0; i < shuffledPieces.length; i++) {
            const pieceFilename = `puzzle_${uuidv4()}_piece_${i}.png`;
            const piecePath = path.join(outputDir, pieceFilename);
            await fs.writeFile(piecePath, shuffledPieces[i]);
            piecesUrls.push(`/puzzles/${pieceFilename}`);
        }
        
        // Also create a scrambled preview (all pieces placed randomly on canvas)
        const scrambledComposite = await this.createScrambledPreview(
            shuffledPieces,
            piecesPerRow,
            pieceWidth,
            pieceHeight
        );
        
        const scrambledFilename = `scrambled_${uuidv4()}.png`;
        const scrambledPath = path.join(outputDir, scrambledFilename);
        await fs.writeFile(scrambledPath, scrambledComposite);
        
        return {
            scrambledImageUrl: `/puzzles/${scrambledFilename}`,
            piecesUrls: piecesUrls
        };
    }
    
    static async createScrambledPreview(
        pieces: Buffer[],
        piecesPerRow: number,
        pieceWidth: number,
        pieceHeight: number
    ): Promise<Buffer> {
        // Create a blank canvas
        const composite = await sharp({
            create: {
                width: pieceWidth * piecesPerRow,
                height: pieceHeight * piecesPerRow,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        }).png().toBuffer();
        
        // Place shuffled pieces in random positions
        let compositeImage = sharp(composite);
        const positions = this.shuffleArray(
            Array.from({ length: pieces.length }, (_, i) => i)
        );
        
        for (let i = 0; i < pieces.length; i++) {
            const row = Math.floor(positions[i] / piecesPerRow);
            const col = positions[i] % piecesPerRow;
            compositeImage = compositeImage.composite([
                {
                    input: pieces[i],
                    left: col * pieceWidth,
                    top: row * pieceHeight
                }
            ]);
        }
        
        return await compositeImage.toBuffer();
    }
    
    static shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    static getPieceCount(difficulty: 'easy' | 'medium' | 'hard'): number {
        switch(difficulty) {
            case 'easy': return 4;   // 2x2 grid
            case 'medium': return 9;  // 3x3 grid
            case 'hard': return 16;   // 4x4 grid
            default: return 4;
        }
    }
}