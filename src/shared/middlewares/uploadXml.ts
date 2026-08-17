import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/xml' || 
      file.mimetype === 'application/xml' || 
      file.originalname.endsWith('.xml')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos XML são aceitos.'));
  }
};

export const uploadXml = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('xml');
