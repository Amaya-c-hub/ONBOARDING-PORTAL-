import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  async handleUpload(file: Express.Multer.File) {
    this.logger.log(`Processing: ${file.originalname} (${file.size} bytes)`);

    return {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(), // add this
      status: 'received',
    };
  }

  async handleMultipleUploads(files: Express.Multer.File[]) {
    return Promise.all(files.map((f) => this.handleUpload(f)));
  }
}
