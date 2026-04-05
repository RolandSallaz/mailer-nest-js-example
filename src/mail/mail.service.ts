import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService implements OnModuleInit {
  constructor(private readonly mailerService: MailerService) {}

  async onModuleInit() {
    await this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      const transporter = this.mailerService['transporter'];

      if (!transporter) {
        throw new Error('Mailer transporter is not initialized');
      }

      await transporter.verify();

      console.log('✅ SMTP connection verified');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      throw error;
    }
  }
}