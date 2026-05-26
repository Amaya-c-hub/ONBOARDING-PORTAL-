import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OfferEntity } from '../offers/offer.entity';

@Entity('Candidate')
export class CandidateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiry: Date;

  @Column({ default: 'PENDING_DOCS' })
  status: string;

  @Column({ unique: true, nullable: true })
  magicToken: string;

  @Column({ type: 'timestamp', nullable: true })
  magicTokenExpiry: Date;

  @Column({ type: 'uuid', unique: true, nullable: true })
  userId: string;

  // Optional: Relation to your existing User table
  // @OneToOne(() => UserEntity)
  // @JoinColumn({ name: 'userId' })
  // user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OfferEntity, (offer) => offer.candidate)
  offers: OfferEntity[];
}
