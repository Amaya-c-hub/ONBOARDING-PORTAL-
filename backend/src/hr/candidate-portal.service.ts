import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Service } from '../integrations/s3.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { CandidateEntity } from '../candidates/candidate.entity';
import { User } from '../auth/entities/user.entity';
import { OfferEntity } from '../offers/offer.entity';
import { DocumentEntity } from '../documents/document.entity';
import { AuditEvent } from '../audit/entities/audit-event.entity';

@Injectable()
export class CandidatePortalService {
  private readonly logger = new Logger(CandidatePortalService.name);
  // Token valid for 7 days
  private readonly TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(OfferEntity)
    private readonly offerRepo: Repository<OfferEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepo: Repository<DocumentEntity>,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
    private readonly s3Service: S3Service,
  ) {}

  /** Generate a secure magic token and persist it to the candidate record */
  async generateMagicToken(candidateId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + this.TOKEN_TTL_MS);

    await this.candidateRepo.update(candidateId, {
      magicToken: token,
      magicTokenExpiry: expiry,
    });

    this.logger.log(`Magic token generated for candidate ${candidateId}, expires ${expiry.toISOString()}`);
    return token;
  }

  /** Validate the token and return the full candidate context (no auth required) */
  async resolveToken(token: string) {
    const candidate = await this.candidateRepo.findOne({
      where: { magicToken: token },
      relations: ['offers'], // Assuming offers relation is defined
    });

    if (!candidate) {
      throw new NotFoundException('Invalid or expired link. Please contact HR.');
    }

    if (!candidate.magicTokenExpiry || candidate.magicTokenExpiry < new Date()) {
      throw new BadRequestException('This link has expired. Please contact HR to resend.');
    }

    // Fetch documents manually since relations might not be set up on DocumentEntity yet
    const documents = await this.documentRepo.find({
      where: { candidateId: candidate.id }
    });

    // Sort offers by createdAt desc
    const sortedOffers = candidate.offers?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];
    const latestOffer = sortedOffers[0] ?? null;
    let offerPdfUrl: string | null = null;

    let templateType = 'STANDARD';
    if (latestOffer?.pdfUrl) {
      const match = latestOffer.pdfUrl.match(/_([A-Z]+)_offer\.pdf$/);
      if (match) templateType = match[1];
      
      try {
        offerPdfUrl = latestOffer.pdfUrl.startsWith('http')
          ? latestOffer.pdfUrl
          : await this.s3Service.getPresignedUrl(latestOffer.pdfUrl);
      } catch {
        this.logger.warn(`Could not generate presigned URL for offer ${latestOffer.id}`);
      }
    }

    const newAudit = this.auditRepo.create({
      action: 'CANDIDATE_PORTAL_VIEWED_MAGIC_LINK',
      userId: candidate.id,
      meta: { source: 'CandidatePortalService' },
      layer: 'HR_PORTAL'
    });
    await this.auditRepo.save(newAudit);

    return {
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        status: candidate.status,
        magicTokenExpiry: candidate.magicTokenExpiry,
      },
      offer: latestOffer
        ? {
            id: latestOffer.id,
            status: latestOffer.status,
            signingUrl: latestOffer.signingUrl,
            sentAt: latestOffer.sentAt,
            pdfUrl: offerPdfUrl,
            templateType,
          }
        : null,
      documents: documents.map((d) => ({
        id: d.id,
        type: d.documentType, // Assuming originalName or documentType
        status: d.status,
      })),
    };
  }

  /** Validate the email and return the full candidate context (JWT auth required) */
  async resolveEmail(email: string) {
    let candidate = await this.candidateRepo.findOne({
      where: { email },
      relations: ['offers'],
    });

    if (!candidate) {
      // Auto‑create a CandidateEntity for the email if it does not exist.
      const newCandidate = this.candidateRepo.create({
        id: uuidv4(),
        email,
        // userId is optional; we omit it if no matching User record exists.
        status: 'PENDING_DOCS',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.candidateRepo.save(newCandidate);
      candidate = newCandidate;
    }

    const documents = await this.documentRepo.find({
      where: { candidateId: candidate.id }
    });

    const sortedOffers = candidate.offers?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];
    const latestOffer = sortedOffers[0] ?? null;
    let offerPdfUrl: string | null = null;

    let templateType = 'STANDARD';
    if (latestOffer?.pdfUrl) {
      const match = latestOffer.pdfUrl.match(/_([A-Z]+)_offer\.pdf$/);
      if (match) templateType = match[1];

      try {
        offerPdfUrl = latestOffer.pdfUrl.startsWith('http')
          ? latestOffer.pdfUrl
          : await this.s3Service.getPresignedUrl(latestOffer.pdfUrl);
      } catch {
        this.logger.warn(`Could not generate presigned URL for offer ${latestOffer.id}`);
      }
    }

    return {
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        status: candidate.status,
        magicTokenExpiry: candidate.magicTokenExpiry,
      },
      offer: latestOffer
        ? {
            id: latestOffer.id,
            status: latestOffer.status,
            signingUrl: latestOffer.signingUrl,
            sentAt: latestOffer.sentAt,
            pdfUrl: offerPdfUrl,
            templateType,
          }
        : null,
      documents: documents.map((d) => ({
        id: d.id,
        type: d.documentType,
        status: d.status,
      })),
    };
  }

  /** Candidate accepts the offer via magic link (triggers webhook-less accept) */
  async acceptOffer(token: string, signatureImage?: string) {
    const ctx = await this.resolveToken(token);

    if (!ctx.offer) {
      throw new NotFoundException('No active offer found for this candidate.');
    }
    if (ctx.offer.status === 'SIGNED') {
      throw new BadRequestException('Offer has already been accepted.');
    }

    await this.offerRepo.update(ctx.offer.id, { 
      status: 'SIGNED',
      ...(signatureImage ? { signatureImage } : {}),
    });

    await this.candidateRepo.update(ctx.candidate.id, { status: 'OFFER_ACCEPTED' });

    const newAudit = this.auditRepo.create({
      action: signatureImage ? 'OFFER_SIGNED_WITH_DRAWN_SIGNATURE' : 'OFFER_ACCEPTED_VIA_MAGIC_LINK',
      userId: ctx.candidate.id,
      meta: { source: 'CandidatePortalService (Option A)' },
      layer: 'HR_PORTAL'
    });
    await this.auditRepo.save(newAudit);

    this.logger.log(`Offer accepted via magic link by candidate ${ctx.candidate.id}`);
    return { message: 'Offer accepted successfully.', offerId: ctx.offer.id };
  }

  /** Candidate rejects the offer via magic link */
  async rejectOffer(token: string, reason?: string) {
    const ctx = await this.resolveToken(token);

    if (!ctx.offer) {
      throw new NotFoundException('No active offer found for this candidate.');
    }

    await this.offerRepo.update(ctx.offer.id, { status: 'EXPIRED' });

    await this.candidateRepo.update(ctx.candidate.id, { status: 'REJECTED' });

    const newAudit = this.auditRepo.create({
      action: 'OFFER_DECLINED_VIA_MAGIC_LINK',
      userId: ctx.candidate.id,
      meta: { source: reason ? `Reason: ${reason}` : 'CandidatePortalService (Option A)' },
      layer: 'HR_PORTAL'
    });
    await this.auditRepo.save(newAudit);

    return { message: 'Offer declined. HR will be notified.' };
  }

  /** Upload a document by the candidate via magic link (no login) */
  async uploadDocument(token: string, file: Express.Multer.File, docType: string) {
    const ctx = await this.resolveToken(token);

    const s3Key = `candidate-uploads/${ctx.candidate.id}/${uuidv4()}_${file.originalname}`;
    await this.s3Service.uploadBuffer(file.buffer, s3Key, file.mimetype);

    // Map to DocumentEntity fields
    const doc = this.documentRepo.create({
      candidateId: ctx.candidate.id,
      documentType: docType,
      s3Key: s3Key,
      status: 'UPLOADED',
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
    const savedDoc = await this.documentRepo.save(doc);

    const newAudit = this.auditRepo.create({
      action: 'DOCUMENT_UPLOADED_VIA_MAGIC_LINK',
      userId: ctx.candidate.id,
      meta: { source: `File: ${file.originalname}` },
      layer: 'HR_PORTAL'
    });
    await this.auditRepo.save(newAudit);

    return { message: 'Document uploaded successfully.', documentId: savedDoc.id };
  }
}
