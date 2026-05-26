import { BadRequestException } from '@nestjs/common';
import { fromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function validateFile(file: Express.Multer.File): Promise<void> {
  // 1. Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestException(
      `File "${file.originalname}" exceeds the ${MAX_FILE_SIZE_MB}MB limit`,
    );
  }

  // 2. Real MIME detection via magic bytes (not just Content-Type header)
  const detected = await fromBuffer(file.buffer);
  const mime: string = (detected?.mime ?? file.mimetype) as string;
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    throw new BadRequestException(
      `File type "${mime}" is not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    );
  }

  // 3. Extension check (basic guard against renamed files)
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new BadRequestException(`File extension ".${ext}" is not allowed`);
  }
}