import { Controller, Get, Post, Param, Body, Query, UploadedFile, UseInterceptors, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatePortalService } from './candidate-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * PORTAL CONTROLLER — Mixed access.
 * Some routes use magic tokens, others use JWT Auth for the dashboard.
 */
@Controller('portal')
export class CandidatePortalController {
  constructor(private readonly portalService: CandidatePortalService) {}

  @Get('me/offer')
  @UseGuards(JwtAuthGuard)
  async getMyOffer(@Req() req: any) {
    const ctx = await this.portalService.resolveEmail(req.user.email);
    return ctx; // The frontend fetchOffer expects { candidate, offer, documents }
  }

  @Post('me/offer/accept')
  @UseGuards(JwtAuthGuard)
  async acceptMyOffer(
    @Req() req: any,
    @Body('signatureImage') signatureImage?: string,
  ) {
    // We can just reuse resolveEmail to get the offer, then update it.
    // However, CandidatePortalService has an acceptOffer method that expects a token.
    // Let's retrieve the candidate and pass its token to acceptOffer.
    const ctx = await this.portalService.resolveEmail(req.user.email);
    const candidate = await this.portalService['candidateRepo'].findOne({ where: { id: ctx.candidate.id } });
    return this.portalService.acceptOffer(candidate.magicToken, signatureImage);
  }

  @Post('me/offer/reject')
  @UseGuards(JwtAuthGuard)
  async rejectMyOffer(
    @Req() req: any,
    @Body('reason') reason?: string,
  ) {
    const ctx = await this.portalService.resolveEmail(req.user.email);
    const candidate = await this.portalService['candidateRepo'].findOne({ where: { id: ctx.candidate.id } });
    return this.portalService.rejectOffer(candidate.magicToken, reason);
  }

  @Get('me/tasks')
  @UseGuards(JwtAuthGuard)
  async getMyTasks(@Req() req: any) {
    // For now, return static tasks until DB schema is added for tasks
    return [
      { id: 1, label: "Verify personal details",    description: "Confirm your name, address, and contact information in your profile.",                category: "Verification", required: false, done: true  },
      { id: 2, label: "Upload required documents",  description: "Submit your Passport, Educational Certificate, Experience Letter, and Insurance Card.", category: "Documents",    required: false, done: true  },
      { id: 3, label: "Sign offer letter",          description: "Review and digitally sign your offer letter before the expiry date.",                   category: "Legal",        required: true,  done: false },
      { id: 4, label: "Complete IT setup form",     description: "Fill in your equipment preferences and remote/on-site setup requirements.",             category: "IT Setup",     required: true,  done: false },
      { id: 5, label: "Acknowledge HR policies",    description: "Read and confirm acceptance of the company's code of conduct and HR policies.",         category: "HR",           required: true,  done: false },
      { id: 6, label: "Set up company email",       description: "Log in to your assigned company email and complete the account setup.",                 category: "IT Setup",     required: false, done: false },
      { id: 7, label: "Join onboarding Slack",      description: "Accept the invite and introduce yourself in #onboarding and your team channel.",        category: "HR",           required: false, done: false },
    ];
  }

  @Get('me/documents')
  @UseGuards(JwtAuthGuard)
  async getMyDocuments(@Req() req: any) {
    const ctx = await this.portalService.resolveEmail(req.user.email);
    return ctx.documents.map((d) => ({
      id: d.id,
      title: d.type || 'Uploaded Document',
      status: d.status?.toLowerCase() === 'verified' ? 'approved' :
              d.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending',
      uploadedAt: new Date().toLocaleDateString(), // Map this properly if available
    }));
  }

  /**
   * Option A: Resolve a magic link token and return candidate context.
   * Called by the frontend when a candidate visits their unique link.
   * GET /portal/offer?token=abc123
   */
  @Get('offer')
  async getOfferByToken(@Query('token') token: string) {
    return this.portalService.resolveToken(token);
  }

  /**
   * Option A: Candidate accepts their offer via magic link.
   * POST /portal/offer/accept
   */
  @Post('offer/accept')
  async acceptOffer(
    @Body('token') token: string,
    @Body('signatureImage') signatureImage?: string,
  ) {
    return this.portalService.acceptOffer(token, signatureImage);
  }

  /**
   * Option A: Candidate declines their offer via magic link.
   * POST /portal/offer/reject
   */
  @Post('offer/reject')
  async rejectOffer(
    @Body('token') token: string,
    @Body('reason') reason?: string,
  ) {
    return this.portalService.rejectOffer(token, reason);
  }

  /**
   * Option A (Optional): Candidate uploads a document via magic link.
   * POST /portal/documents/upload
   */
  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Body('token') token: string,
    @Body('docType') docType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.portalService.uploadDocument(token, file, docType);
  }
}
