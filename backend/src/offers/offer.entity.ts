import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CandidateEntity } from '../candidates/candidate.entity';

@Entity('Offer')
export class OfferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'DRAFT' })
  status: string;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ nullable: true })
  signatureId: string;

  @Column({ nullable: true })
  signingUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ nullable: true })
  signatureImage: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => CandidateEntity, (candidate) => candidate.offers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
