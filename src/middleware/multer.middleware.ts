import multer from "multer"
const storage = multer.memoryStorage();

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});