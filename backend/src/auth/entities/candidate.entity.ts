import { Entity, Column, PrimaryColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

/**
 * This entity represents the Candidate table managed by Intern 4 (Candidate Portal/HR Workflow).
 * We use it to cross-check registrations during login.
 */
@Entity('Candidate')
export class Candidate {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Other columns (magicToken, otp etc.) are ignored as they aren't needed for Auth sync
}
