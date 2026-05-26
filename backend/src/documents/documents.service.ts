import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from './document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly repo: Repository<DocumentEntity>,
  ) {}

  async save(data: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const doc = this.repo.create(data);
    return this.repo.save(doc);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return this.repo.find({ order: { uploadedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<DocumentEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByStatus(status: string): Promise<DocumentEntity[]> {
    return this.repo.find({
      where: { status },
      order: { uploadedAt: 'DESC' },
    });
  }

  async findByCandidateId(candidateId: string): Promise<DocumentEntity[]> {
    return this.repo.find({
      where: { candidateId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async updateReview(
    id: string,
    status: 'approved' | 'rejected',
    comments?: string,
  ): Promise<DocumentEntity | null> {
    await this.repo.update(id, { status, reviewComments: comments });
    return this.repo.findOne({ where: { id } });
  }
}