import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { validateFile } from './upload.validator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Single file upload
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await validateFile(file);
    return this.uploadService.handleUpload(file);
  }

  // Multiple files upload
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('No files provided');

    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await validateFile(file);
    }
    return this.uploadService.handleMultipleUploads(files);
  }
}
