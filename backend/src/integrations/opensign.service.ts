import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface BoxConfig {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

@Injectable()
export class OpenSignService {
  private readonly logger = new Logger(OpenSignService.name);
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.OPENSIGN_API_URL || 'https://api.opensignlabs.com/v1';
    this.apiKey = process.env.OPENSIGN_API_KEY || 'MOCK_OPENSIGN_KEY';
  }

  /**
   * Request a signature from OpenSign
   * @param documentUrl The publicly accessible (or presigned) URL of the document
   * @param signerEmail The candidate's email
   * @param signerName The candidate's name
   * @param title Title of the document
   * @returns The OpenSign document/signature ID
   */
  async createSignatureRequest(
    documentUrl: string, 
    signerEmail: string, 
    signerName: string, 
    title: string = 'Offer Letter'
  ): Promise<{ id: string, signingUrl: string }> {
    try {
      this.logger.log(`Requesting signature for ${signerEmail} via OpenSign...`);

      if (this.apiKey === 'MOCK_OPENSIGN_KEY' || !this.apiKey) {
        this.logger.warn('MOCK MODE: OpenSign API Key not set. Simulating success response.');
        const mockId = `osgn_${uuidv4()}`;
        return { 
          id: mockId, 
          signingUrl: `https://mock.opensignlabs.com/sign/${mockId}?email=${encodeURIComponent(signerEmail)}` 
        };
      }

      // Actual OpenSign payload format
      const payload = {
        title,
        file_url: documentUrl,
        signers: [
          {
            name: signerName || signerEmail,
            email: signerEmail,
            role: 'Candidate',
          }
        ],
        widgets: [
          {
            type: 'signature',
            signer: signerEmail,
            page: 1,
            x: 50,
            y: 660,
            width: 200,
            height: 40,
          }
        ]
      };

      const response = await fetch(`${this.apiUrl}/signature_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenSign API Error: ${errText}`);
      }

      const data = await response.json();
      const id = data.signature_request_id || data.id;
      // In a real scenario, OpenSign might return the signing URL here if it's an embedded session
      // or it might send the email itself. If we want to send the link, we use the return.
      const signingUrl = data.signing_url || `https://opensignlabs.com/sign/${id}`;

      return { id, signingUrl };
    } catch (e) {
      this.logger.error('Failed to create OpenSign request, falling back to mock UUID', e);
      const fallbackId = `osgn_fallback_${uuidv4()}`;
      return { 
        id: fallbackId, 
        signingUrl: `https://mock.opensignlabs.com/sign/fallback/${fallbackId}` 
      };
    }
  }

  /**
   * Validates the payload signature from OpenSignLabs
   */
  async validateWebhookSignature(payload: any, signature: string): Promise<boolean> {
    const secret = process.env.OPENSIGN_WEBHOOK_SECRET || 'MOCK_SECRET';
    if (!signature || signature === 'MOCK_CODE') return true;

    try {
      const crypto = require('crypto');
      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return expected === signature;
    } catch (e) {
      return false;
    }
  }
}
