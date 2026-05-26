import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { S3Service } from './s3/s3.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { validateFile } from '../upload/upload.validator';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly s3: S3Service,
    private readonly documentsService: DocumentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    folder = 'documents',
    documentType?: string,
    candidateId?: string,
    expiryDate?: string,
  ): Promise<UploadResponseDto> {
    await validateFile(file);

    const id = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${folder}/${id}${ext}`;

    // upload to S3
    await this.s3.upload(key, file.buffer, file.mimetype, {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
    });

    // save metadata to DB
    await this.documentsService.save({
      id,
      candidateId: candidateId ?? 'unknown',
      originalName: file.originalname,
      s3Key: key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      folder,
      documentType,
      status: 'pending',
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });

    // TODO: connect Intern 5 when ready
    await this.notificationsService.sendUploadConfirmation({
      candidateEmail: `${candidateId ?? 'candidate'}@example.com`,
      candidateName: candidateId ?? 'Candidate',
      documentType: documentType ?? 'document',
      uploadedAt: new Date().toISOString(),
    });

    await this.notificationsService.auditLog({
      userId: candidateId ?? 'unknown',
      action: 'DOCUMENT_UPLOADED',
      resource: key,
      metadata: { fileSize: `${file.size}` },
    });

    const signedUrl = await this.s3.getSignedUrl(key, 3600);

    return {
      id,
      originalName: file.originalname,
      key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedAt: new Date(),
      signedUrl,
    };
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder = 'documents',
    documentType?: string,
    candidateId?: string,
    expiryDate?: string,
  ) {
    const results = await Promise.all(
      files.map((f) => this.uploadDocument(f, folder, documentType, candidateId, expiryDate)),
    );
    return { documentIds: results.map((r) => r.id), status: 'pending' };
  }

  async getPendingReview() {
    return this.documentsService.findByStatus('pending');
  }

  async findByCandidateId(candidateId: string) {
    return this.documentsService.findByCandidateId(candidateId);
  }

  async reviewDocument(id: string, status: 'approved' | 'rejected', comments?: string) {
    return this.documentsService.updateReview(id, status, comments);
  }

  async getSignedUrl(key: string): Promise<{ signedUrl: string }> {
    const exists = await this.s3.exists(key);
    if (!exists) throw new NotFoundException(`File not found: ${key}`);
    const signedUrl = await this.s3.getSignedUrl(key, 3600);
    return { signedUrl };
  }

  async deleteDocument(key: string): Promise<{ message: string }> {
    const exists = await this.s3.exists(key);
    if (!exists) throw new NotFoundException(`File not found: ${key}`);
    await this.s3.delete(key);
    return { message: `File deleted: ${key}` };
  }
}