import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../integrations/s3.service';
import { OpenSignService } from '../integrations/opensign.service';
import { CandidateInteractionService } from './candidate-interaction.service';
import { CandidatePortalService } from './candidate-portal.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CandidateEntity } from '../candidates/candidate.entity';
import { OfferEntity } from '../offers/offer.entity';
import { DocumentEntity } from '../documents/document.entity';
import { User } from '../auth/entities/user.entity';
import { AuditEvent } from '../audit/entities/audit-event.entity';

@Injectable()
export class HrService {

  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(OfferEntity)
    private readonly offerRepo: Repository<OfferEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepo: Repository<DocumentEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,

    private readonly s3Service: S3Service,
    private readonly openSignService: OpenSignService,
    private readonly interactionService: CandidateInteractionService,
    private readonly portalService: CandidatePortalService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async getReviewQueue() {
    const candidates = await this.candidateRepo.find({
      where: {
        status: In(['PENDING_DOCS', 'IN_REVIEW']),
      },
      order: {
        updatedAt: 'DESC',
      },
    });

    if (candidates.length === 0) return [];

    const candidateIds = candidates.map(c => c.id);
    const allDocuments = await this.documentRepo.find({
      where: { candidateId: In(candidateIds) }
    });

    const mapped = await Promise.all(candidates.map(async (c) => {
      const candidateDocs = allDocuments.filter(d => d.candidateId === c.id);
      const documentsWithUrls = await Promise.all(candidateDocs.map(async (doc) => {
        if (doc.s3Key && doc.s3Key.startsWith('http')) return { ...doc, url: doc.s3Key };
        const presignedUrl = await this.s3Service.getPresignedUrl(doc.s3Key);
        return { ...doc, url: presignedUrl, type: doc.documentType };
      }));
      return { ...c, documents: documentsWithUrls };
    }));

    return mapped;
  }

  async updateDocumentStatus(docId: string, status: 'APPROVED' | 'REJECTED') {
    await this.documentRepo.update(docId, { status });
    return this.documentRepo.findOne({ where: { id: docId } });
  }

  async updateCandidateStatus(candidateId: string, status: any) {
    await this.candidateRepo.update(candidateId, { status });
    return this.candidateRepo.findOne({ where: { id: candidateId } });
  }

  async generateOffer(candidateId: string, templateType: string = 'STANDARD') {
    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    // Generate PDF in Memory
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Colors
    const primaryColor = '#4F46E5';
    const textColor = '#1F2937';
    const mutedColor = '#6B7280';

    // Header
    doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('LINNK GLOBAL SOLUTIONS', { align: 'left' });
    doc.fillColor(mutedColor).fontSize(10).font('Helvetica').text('Enterprise Onboarding & Identity Manifest', { align: 'left' });
    doc.moveDown(0.5);
    doc.strokeColor(primaryColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(2);

    // Date & Ref
    doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text(`DATE: ${new Date().toLocaleDateString().toUpperCase()}`);
    doc.text(`REF: LNK-OFFER-${candidate.id.slice(0, 8).toUpperCase()}`);
    doc.moveDown(2);

    // Recipient
    doc.fontSize(12).text('CANDIDATE IDENTITY:');
    doc.font('Helvetica').text(candidate.firstName ? `${candidate.firstName} ${candidate.lastName}` : candidate.email);
    doc.text(candidate.email);
    doc.moveDown(2);

    // Subject
    doc.font('Helvetica-Bold').text(`SUBJECT: OFFER OF EMPLOYMENT - ${templateType} PROTOCOL`);
    doc.moveDown(1);

    // Content based on template
    doc.font('Helvetica').fontSize(11).lineGap(2).text(`Dear ${candidate.firstName || 'Candidate'},`);
    doc.moveDown(1);
    
    if (templateType === 'EXECUTIVE') {
      doc.text('We are exceptionally pleased to extend this offer for an Executive-level position within Linnk Global Solutions. Your track record of leadership and strategic vision aligns perfectly with our global expansion goals.');
      doc.moveDown();
      doc.font('Helvetica-Bold').text('COMPENSATION & BENEFITS (EXECUTIVE):');
      doc.font('Helvetica').text('• Base Salary: Competitive Market Rate (Refer to Appendix A)');
      doc.text('• Performance Bonus: 25% Annual Targeted Incentive');
      doc.text('• Equity: Tier 1 Stock Option Allocation');
      doc.text('• Benefits: Global Premium Health Coverage & Retirement Matching');
    } else if (templateType === 'INTERN') {
      doc.text('Congratulations on being selected for the Linnk internship program. This fixed-term engagement is designed to provide you with deep exposure to enterprise-scale infrastructure and identity management systems.');
      doc.moveDown();
      doc.font('Helvetica-Bold').text('PROGRAM DETAILS (INTERN):');
      doc.font('Helvetica').text('• Duration: 6 Months (Renewable based on performance)');
      doc.text('• Stipend: Monthly Educational Allowance');
      doc.text('• Mentorship: Senior Architecture Guidance');
    } else {
      doc.text('We are pleased to offer you a position at Linnk Global Solutions. Following our evaluation of your technical capabilities and professional alignment, we are confident you will be a vital asset to our mission.');
      doc.moveDown();
      doc.font('Helvetica-Bold').text('COMPENSATION & BENEFITS (STANDARD):');
      doc.font('Helvetica').text('• Base Salary: Monthly Remuneration as discussed');
      doc.text('• Annual Leave: 21 Standard Business Days');
      doc.text('• Health: Standard Group Insurance Enrollment');
    }

    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('NEXT STEPS:');
    doc.font('Helvetica').text('Deployment into our ecosystem requires a verified digital signature. Please execute the OpenSign sequence linked in your secure notification.');
    
    const signatureY = 700;
    doc.strokeColor('#E5E7EB').lineWidth(0.5).moveTo(50, signatureY).lineTo(250, signatureY).stroke();
    doc.fontSize(10).text('Authorized Document Signature', 50, signatureY + 5);
    doc.fontSize(10).text('LINNK GLOBAL HR SOLUTIONS', 50, signatureY + 20);
    
    doc.end();

    await new Promise((resolve) => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(buffers);

    const s3Key = `offers/${candidate.id}/${uuidv4()}_${templateType}_offer.pdf`;
    
    // Upload memory stream to AWS S3
    await this.s3Service.uploadBuffer(pdfBuffer, s3Key, 'application/pdf');

    // Generate temporary authenticated URL so OpenSign can read it
    const s3OfferUrl = await this.s3Service.getPresignedUrl(s3Key);

    // Call OpenSign integration API
    const { id: signatureId, signingUrl } = await this.openSignService.createSignatureRequest(
      s3OfferUrl, 
      candidate.email, 
      candidate.firstName || candidate.email,
      'Your Employment Offer Letter'
    );

    const newOffer = this.offerRepo.create({
      id: uuidv4(),
      candidateId,
      pdfUrl: s3Key,
      signatureId,
      signingUrl,
      status: 'SENT',
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const offer = await this.offerRepo.save(newOffer);

    await this.updateCandidateStatus(candidateId, 'OFFER_PENDING');

    const audit1 = this.auditRepo.create({
      action: 'OFFER_GENERATED_AND_SENT_INTERACTION_LAYER',
      userId: candidateId,
      meta: { source: 'HrService -> CandidateInteractionService' },
      layer: 'HR_PORTAL'
    });
    await this.auditRepo.save(audit1);

    this.eventEmitter.emit('audit.log', {
      userId: candidateId,
      action: 'OFFER_GENERATED_AND_SENT',
      resource: `offer:${offer.id}`,
      timestamp: new Date(),
      metadata: { templateType }
    });

    // Generate magic token (Option A) for no-login candidate portal
    const magicToken = await this.portalService.generateMagicToken(candidateId);
    const appBaseUrl = process.env.APP_URL || 'http://localhost:3000';
    const magicLinkUrl = `${appBaseUrl}/offer/view?token=${magicToken}`;

    // Delegate interaction to the specialized service (sends email with all 3 options)
    await this.interactionService.sendOfferEmail(candidate, offer, pdfBuffer, magicLinkUrl);

    // Emit event for Intern 5 Notifications contract
    this.eventEmitter.emit('offer.sent', {
      candidateId,
      offerUrl: offer.signingUrl,
      signingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    return { 
      message: 'Offer generated, uploaded to S3, and dispatched via Candidate Interaction Layer.', 
      offerId: offer.id,
      signingUrl: offer.signingUrl,
      magicLinkUrl,
    };
  }

  async signOffer(offerId: string) {
    const offer = await this.offerRepo.findOne({
      where: { id: offerId },
      relations: ['candidate'],
    });
    if (!offer) throw new NotFoundException('Offer not found');

    await this.offerRepo.update(offerId, { status: 'SIGNED' });
    await this.updateCandidateStatus(offer.candidateId, 'OFFER_ACCEPTED');

    const auditEvent = this.auditRepo.create({
      action: 'OFFER_SIGNED_OPENSIGN', 
      userId: offer.candidateId,
      layer: 'HR_PORTAL'
    });
    await this.auditRepo.save(auditEvent);

    return { message: 'Offer electronically signed successfully via OpenSign parameters.', offer };
  }

  async getAllCandidates() {
    const candidates = await this.candidateRepo.find({
      order: { createdAt: 'DESC' }
    });

    if (candidates.length === 0) return [];
    
    const candidateIds = candidates.map(c => c.id);
    const documents = await this.documentRepo.find({ where: { candidateId: In(candidateIds) } });
    
    return candidates.map(c => ({
      ...c,
      documents: documents.filter(d => d.candidateId === c.id).map(d => ({ ...d, type: d.documentType, url: d.s3Key }))
    }));
  }

  async getAllOffers() {
    const offers = await this.offerRepo.find({
      relations: ['candidate'],
      order: { createdAt: 'DESC' }
    });

    return Promise.all(offers.map(async (offer) => {
      if (!offer.pdfUrl) return offer;
      if (offer.pdfUrl.startsWith('http')) return offer;
      const presignedUrl = await this.s3Service.getPresignedUrl(offer.pdfUrl);
      return { ...offer, pdfUrl: presignedUrl };
    }));
  }

  async getCandidateOffer(candidateId: string) {
    const offer = await this.offerRepo.findOne({
      where: { candidateId },
      order: { createdAt: 'DESC' }
    });

    if (!offer) {
      throw new NotFoundException('No offer found for this candidate');
    }

    let url = offer.pdfUrl;
    if (url && !url.startsWith('http')) {
      url = await this.s3Service.getPresignedUrl(url);
    }

    return {
      offerUrl: url,
      status: offer.status === 'SIGNED' ? 'signed' : 'pending',
      generatedAt: offer.createdAt
    };
  }

  async getAllDocuments() {
    const docs = await this.documentRepo.find({
      order: { uploadedAt: 'DESC' }
    });
    // Manual mapping to candidate relations is omitted for simplicity unless candidate details are heavily needed

    return Promise.all(docs.map(async (doc) => {
      if (doc.s3Key && doc.s3Key.startsWith('http')) return { ...doc, url: doc.s3Key, type: doc.documentType };
      const presignedUrl = await this.s3Service.getPresignedUrl(doc.s3Key);
      return { ...doc, url: presignedUrl, type: doc.documentType };
    }));
  }

  async inviteCandidate(email: string, firstName?: string, lastName?: string) {
    const existing = await this.candidateRepo.findOne({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Candidate already exists');
    }
    // 🛡️ STEP 1: Ensure a master User record exists for Intern 1's Auth layer
    let user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      const newUser = this.userRepo.create({
        email,
        role: 'candidate' as any,
        isActive: true
      });
      user = await this.userRepo.save(newUser);
    }

    // 👤 STEP 2: Create or Link the HR Candidate Profile
    const newCandidate = this.candidateRepo.create({
      id: uuidv4(),
      email,
      firstName,
      lastName,
      status: 'PENDING_DOCS',
      userId: user.id, // Foreign Key Link
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const candidate = await this.candidateRepo.save(newCandidate);

    // 📝 STEP 3: Record in the master audit_events table (Intern 5 requirement)
    const audit = this.auditRepo.create({
      userId: user.id,
      email: email,
      action: 'CANDIDATE_INVITED',
      layer: 'HR_PORTAL',
      resource: `candidate:${candidate.id}`,
      meta: { firstName, lastName }
    });
    await this.auditRepo.save(audit);

    // Fire Document Request email immediately so candidate can upload docs
    const magicToken = await this.portalService.generateMagicToken(candidate.id);
    const appBaseUrl = process.env.APP_URL || 'http://localhost:3000';
    const magicLinkUrl = `${appBaseUrl}/offer/view?token=${magicToken}`;

    await this.interactionService.sendDocumentRequestEmail(candidate, magicLinkUrl);

    return candidate;
  }

  async getStats() {
    const [candidates, offers, pendingDocsCount, allCandidates] = await Promise.all([
      this.candidateRepo.count(),
      this.offerRepo.count(),
      this.candidateRepo.count({
        where: {
          status: In(['PENDING_DOCS', 'IN_REVIEW'])
        }
      }),
      this.candidateRepo.find({ select: ['status'] })
    ]);

    const acceptedOffers = await this.offerRepo.count({
      where: { status: 'SIGNED' }
    });

    // Calculate distribution for the dashboard charts
    const distribution = {
      DEPLOYMENT: allCandidates.filter(c => c.status === 'OFFER_PENDING' || c.status === 'OFFER_ACCEPTED').length,
      SIGNATURE: allCandidates.filter(c => c.status === 'OFFER_ACCEPTED').length,
      ARTIFACT_ERROR: allCandidates.filter(c => c.status === 'REJECTED' || (c.status === 'PENDING_DOCS' && candidates > 0)).length,
    };

    // Calculate percentages
    const total = allCandidates.length || 1;
    const stats = {
      candidates,
      offers,
      pendingDocs: pendingDocsCount,
      acceptedOffers,
      distribution: [
        { label: "Deployment", val: Math.round((distribution.DEPLOYMENT / total) * 100), color: "bg-indigo-500" },
        { label: "Signature", val: Math.round((distribution.SIGNATURE / total) * 100), color: "bg-emerald-500" },
        { label: "Artifact Error", val: Math.round((distribution.ARTIFACT_ERROR / total) * 100), color: "bg-rose-500" }
      ]
    };

    return stats;
  }

  async getActivity() {
    return this.auditRepo.find({
      take: 10,
      order: { createdAt: 'DESC' },
    });
  }

  async deleteCandidate(id: string) {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    await this.candidateRepo.delete(id);

    const auditEvent = this.auditRepo.create({
      action: 'CANDIDATE_PROFILE_DELETED',
      meta: { source: `Admin deleted profile: ${candidate.email}` },
      layer: 'HR_PORTAL'
    });
    await this.auditRepo.save(auditEvent);

    return { message: 'Candidate and all associated data permanently deleted.' };
  }

  async handleOpenSignWebhook(payload: any, signature: string) {
    const isValid = await this.openSignService.validateWebhookSignature(payload, signature);
    if (!isValid) throw new Error('Unauthenticated webhook source.');

    // Extract signature request ID or simulation ID
    const signatureId = payload.data?.signature_request_id;
    const simulationOfferId = payload.data?.offer_id;

    const offer = await this.offerRepo.findOne({
      where: simulationOfferId 
        ? { id: simulationOfferId } 
        : { signatureId: signatureId },
      relations: ['candidate']
    });

    if (!offer) {
      return { status: 'ignored', reason: 'unknown_reference' };
    }

    if (payload.event_type === 'document.signed' || payload.event_type === 'signature_request.signed') {
      await this.offerRepo.update(offer.id, { status: 'SIGNED' });
      await this.updateCandidateStatus(offer.candidateId, 'OFFER_ACCEPTED');

      const auditEvent = this.auditRepo.create({
        action: 'OFFER_SIGNED_AUTOMATED', 
        userId: offer.candidateId,
        meta: { source: `Webhook verified via OpenSign Logic` },
        layer: 'HR_PORTAL'
      });
      await this.auditRepo.save(auditEvent);

      // 🔔 Dispatch Notification to HR (Intern 5 Contract)
      this.eventEmitter.emit('offer.signed', {
        candidateId: offer.candidateId,
        offerId: offer.id,
        timestamp: new Date()
      });
    }

    return { status: 'processed', offerId: offer.id };
  }
}
