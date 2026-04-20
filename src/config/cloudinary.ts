import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});
type ResourceType = "image" | "raw" | "video"|"auto";

export default cloudinary;


export const uploadToCloudinary = (
  fileBuffer: Buffer,
  resourceType: ResourceType = "image",
  fileName?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: resourceType,
          folder: "qrpuzzle",
          public_id: fileName as string, // ✅ IMPORTANT
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url || "");
        }
      )
      .end(fileBuffer);
  });
};
