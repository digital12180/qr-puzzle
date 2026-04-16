import { customAlphabet } from 'nanoid';

// Define your allowed characters
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Create nanoid generator with length 15
const nanoid = customAlphabet(alphabet, 15);

export const generateUniqueKey = (): string => {
  return nanoid();
};