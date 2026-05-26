import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  candidateId: string;

  @Column()
  originalName: string;

  @Column()
  s3Key: string;

  @Column()
  mimeType: string;

  @Column()
  sizeBytes: number;

  @Column({ nullable: true })
  folder: string;

  @Column({ nullable: true })
  documentType: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  reviewComments: string;

  @CreateDateColumn()
  uploadedAt: Date;
}