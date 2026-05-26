import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // buffer in memory before S3 upload
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}