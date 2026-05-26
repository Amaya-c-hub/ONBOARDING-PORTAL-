import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus, Headers, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/entities/user.entity';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR, Role.MANAGER)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('queue')
  async getQueue() {
    return this.hrService.getReviewQueue();
  }

  @Patch('documents/:docId/status')
  async updateDocumentStatus(
    @Param('docId') docId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED'
  ) {
    return this.hrService.updateDocumentStatus(docId, status);
  }

  @Patch('candidates/:candidateId/status')
  async updateCandidateStatus(
    @Param('candidateId') candidateId: string,
    @Body('status') status: string
  ) {
    return this.hrService.updateCandidateStatus(candidateId, status);
  }

  @Post('offer/generate/:candidateId')
  @HttpCode(HttpStatus.CREATED)
  async generateOffer(
    @Param('candidateId') candidateId: string,
    @Body('templateType') templateType: string
  ) {
    return this.hrService.generateOffer(candidateId, templateType);
  }

  @Post('offer/:offerId/sign')
  async signOffer(@Param('offerId') offerId: string) {
    return this.hrService.signOffer(offerId);
  }

  @Get('candidates')
  async getAllCandidates() {
    return this.hrService.getAllCandidates();
  }

  @Get('offers')
  async getAllOffers() {
    return this.hrService.getAllOffers();
  }

  @Get('offers/:candidateId')
  async getCandidateOffer(@Param('candidateId') candidateId: string) {
    return this.hrService.getCandidateOffer(candidateId);
  }

  @Get('documents')
  async getAllDocuments() {
    return this.hrService.getAllDocuments();
  }

  @Post('invite')
  async inviteCandidate(
    @Body('email') email: string,
    @Body('firstName') firstName?: string,
    @Body('lastName') lastName?: string,
  ) {
    return this.hrService.inviteCandidate(email, firstName, lastName);
  }

  @Get('activity')
  async getActivity() {
    return this.hrService.getActivity();
  }

  @Get('stats')
  async getStats() {
    return this.hrService.getStats();
  }

  @Delete('candidates/:id')
  async deleteCandidate(@Param('id') id: string) {
    return this.hrService.deleteCandidate(id);
  }

  // OPENSIGN WEBHOOKS
  @Post('webhook/opensign')
  async handleOpenSignWebhook(
    @Body() payload: any,
    @Headers('x-opensign-signature') signature: string
  ) {
    return this.hrService.handleOpenSignWebhook(payload, signature);
  }

  @Get('webhook/opensign/simulate/:offerId')
  async simulateSignature(@Param('offerId') offerId: string) {
    return this.hrService.handleOpenSignWebhook({
      event_type: 'document.signed',
      data: {
        signature_request_id: 'SIMULATED',
        offer_id: offerId // Special field for simulation
      }
    }, 'MOCK_CODE');
  }
}
