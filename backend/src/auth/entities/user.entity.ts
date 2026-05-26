import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum Role {
  CANDIDATE = 'candidate',
  HR        = 'hr',
  MANAGER   = 'manager',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false }) // Hide password by default in queries
  password?: string;

  @Column({ type: 'enum', enum: Role, default: Role.CANDIDATE })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
