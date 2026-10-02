import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'xml') {
    if (file.mimetype === 'text/xml' ||
        file.mimetype === 'application/xml' ||
        file.originalname.endsWith('.xml')) {
      cb(null, true);
    } else {
      cb(new Error('O campo "xml" deve ser um arquivo XML.'));
    }
    return;
  }

  if (file.fieldname === 'etiqueta') {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('O campo "etiqueta" deve ser um arquivo PDF.'));
    }
    return;
  }

  cb(new Error(`Campo de arquivo não reconhecido: "${file.fieldname}".`));
};

/**
 * Multipart do webhook de NF-e do CIGAM: campo "xml" (obrigatório) e, opcionalmente,
 * campo "etiqueta" com o PDF da etiqueta de envio já gerada no ERP.
 */
export const uploadNfeFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (etiqueta em PDF tende a ser maior que o XML)
  },
}).fields([
  { name: 'xml', maxCount: 1 },
  { name: 'etiqueta', maxCount: 1 },
]);
