import {
  Controller, Post, Get, Put, Delete,
  UploadedFile, UploadedFiles, UseInterceptors,
  Param, BadRequestException, Query, Body, Headers,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { ExpiryService } from '../expiry/expiry.service';

@Controller('documents')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly expiryService: ExpiryService,
  ) {}

  // ─── Intern 2 calls this ───────────────────────────────────────────
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Headers('authorization') auth: string,
    @Body('documentType') documentType?: string,
    @Body('candidateId') candidateId?: string,
    @Body('expiryDate') expiryDate?: string,
    @Query('folder') folder?: string,
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');
    return this.uploadsService.uploadMultiple(files, folder, documentType, candidateId, expiryDate);
  }

  // Single file — for testing
  @Post('upload/single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType?: string,
    @Body('candidateId') candidateId?: string,
    @Body('expiryDate') expiryDate?: string,
    @Query('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.uploadsService.uploadDocument(file, folder, documentType, candidateId, expiryDate);
  }

  // ─── Intern 4 calls this ───────────────────────────────────────────
  @Get('pending-review')
  async getPendingReview() {
    return this.uploadsService.getPendingReview();
  }

  // ─── Intern 2 (Candidate) calls this ────────────────────────────────
  @Get('candidate/:id')
  async getCandidateDocuments(@Param('id') id: string) {
    return this.uploadsService.findByCandidateId(id);
  }

  // ─── Intern 4 calls this ───────────────────────────────────────────
  @Put(':id/review')
  async reviewDocument(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected'; comments?: string },
  ) {
    return this.uploadsService.reviewDocument(id, body.status, body.comments);
  }

  // Get signed URL
  @Get('signed-url')
  async getSignedUrl(@Query('key') key: string) {
    if (!key) throw new BadRequestException('key query param is required');
    return this.uploadsService.getSignedUrl(key);
  }

  // Testing only — trigger expiry check manually
  @Get('trigger-expiry-check')
  async triggerExpiryCheck() {
    return this.expiryService.triggerExpiryCheck();
  }

  // Delete file
  @Delete('*path')
  async deleteFile(@Param('path') key: string) {
    return this.uploadsService.deleteDocument(key);
  }
}