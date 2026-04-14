import fs from "fs";

export const getFileBuffer = (filePath: string): Buffer => {
  return fs.readFileSync(filePath);
};