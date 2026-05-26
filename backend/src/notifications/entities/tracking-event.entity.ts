import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tracking_events')
export class TrackingEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // e.g., 'EMAIL_SENT', 'DOCUMENT_UPLOADED', 'OFFER_SIGNED'

  @Column({ nullable: true })
  recipientEmail: string;

  @Column({ nullable: true })
  candidateId: string;

  @Column({ default: 'SUCCESS' })
  status: string;

  @CreateDateColumn()
  timestamp: Date;
}
