export class UploadResponseDto {
  id: string;
  originalName: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  signedUrl?: string;
}