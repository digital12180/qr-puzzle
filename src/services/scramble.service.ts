// src/services/scramble.service.ts
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
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

                const extractWidth = Math.min(pieceWidth, width - col * pieceWidth);
                const extractHeight = Math.min(pieceHeight, height - row * pieceHeight);

                const piece = await sharp(qrImageBuffer)
                    .extract({
                        left: col * pieceWidth,
                        top: row * pieceHeight,
                        width: extractWidth,
                        height: extractHeight
                    })
                    .toBuffer();

                if (!piece || piece.length === 0) {
                    throw new Error(`Invalid piece at row ${row}, col ${col}`);
                }

                imagePieces.push(piece);
            }
        }



        // Shuffle pieces randomly
        const shuffledPieces = this.shuffleArray([...imagePieces]);

        console.log("Total pieces:", shuffledPieces.length);
        console.log("Sample piece:", shuffledPieces[0]?.length);
        // Save each piece as separate image for physical printing
        const piecesUrls: string[] = [];
        const outputDir = path.join(process.cwd(), 'public/puzzles');
        await fs.mkdir(outputDir, { recursive: true });

        for (let i = 0; i < shuffledPieces.length; i++) {

            const piece = shuffledPieces[i];

            // ✅ Skip invalid pieces
            if (!piece || !Buffer.isBuffer(piece) || piece.length === 0) {
                console.warn(`⚠️ Skipping invalid piece at index ${i}`);
                continue;
            }

            const pieceFilename = `puzzle_${uuidv4()}_piece_${i}.png`;
            const piecePath = path.join(outputDir, pieceFilename);

            await fs.writeFile(piecePath, piece);

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
        // const positions = this.shuffleArray(
        //     Array.from({ length: pieces.length }, (_, i) => i)
        // );
        const validPieces = pieces.filter(
            (p) => p && Buffer.isBuffer(p) && p.length > 0
        );

        const positions = this.shuffleArray(
            Array.from({ length: validPieces.length }, (_, i) => i)
        );

        for (let i = 0; i < validPieces.length; i++) {

            const pos = positions[i];

            if (pos === undefined) {
                console.warn(`Invalid position at index ${i}`);
                continue;
            }

            const row = Math.floor(pos / piecesPerRow);
            const col = pos % piecesPerRow;

            const resizedPiece = await sharp(validPieces[i])
                .resize(pieceWidth, pieceHeight)
                .toBuffer();

            compositeImage = compositeImage.composite([
                {
                    input: resizedPiece,
                    left: col * pieceWidth,
                    top: row * pieceHeight
                }
            ]);
        }
        return await compositeImage.toBuffer();
    }

    static shuffleArray<T>(array: T[]): T[] {

        if (!array || !Array.isArray(array)) {
            console.error("❌ Invalid array passed to shuffle:", array);
            return [];
        }

        const cleanArray = array.filter(
            (item): item is T => item !== undefined && item !== null
        );

        for (let i = cleanArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            const a = cleanArray[i];
            const b = cleanArray[j];

            // ✅ Safety check (fixes TS error)
            if (a === undefined || b === undefined) {
                console.warn(`Skip swap i=${i}, j=${j}`);
                continue;
            }

            cleanArray[i] = b;
            cleanArray[j] = a;
        }

        return cleanArray;
    }

    static getPieceCount(difficulty: 'easy' | 'medium' | 'hard'): number {
        switch (difficulty) {
            case 'easy': return 4;   // 2x2 grid
            case 'medium': return 9;  // 3x3 grid
            case 'hard': return 16;   // 4x4 grid
            default: return 4;
        }
    }
}