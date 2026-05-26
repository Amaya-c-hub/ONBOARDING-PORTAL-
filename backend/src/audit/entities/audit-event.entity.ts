import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum AuditAction {
  OTP_SENT        = 'OTP_SENT',
  LOGIN_SUCCESS   = 'LOGIN_SUCCESS',
  LOGIN_FAILED    = 'LOGIN_FAILED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  LOGOUT          = 'LOGOUT',
  CAPTCHA_FAILED  = 'CAPTCHA_FAILED',
  CANDIDATE_CREATED = 'CANDIDATE_CREATED',
  CANDIDATE_STATUS_UPDATED = 'CANDIDATE_STATUS_UPDATED',
}

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'varchar', default: 'UNKNOWN' })
  action: string;

  @Column({ nullable: true })
  resource: string;

  @Column({ nullable: true, default: 'Authentication' })
  layer: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
