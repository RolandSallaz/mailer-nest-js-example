import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailDto } from './dto/SendEmail.dto';
import { mailerConfig } from '../config/mailer.config';
import type { TMailerConfig } from '../config/mailer.config';

@Injectable()
export class MailService implements OnModuleInit {
    constructor(
        private readonly mailerService: MailerService,
        @Inject(mailerConfig.KEY)
        private readonly config: TMailerConfig,

    ) { }

    async onModuleInit() {
        await this.verifyConnection(); //Проверка подключения при инициализации модуля
    }

    private sleep(ms: number): Promise<void> { //Для ретраев
        return new Promise((resolve) => setTimeout(resolve, ms));
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
        }
    }

    async sendEmail(dto: SendEmailDto): Promise<void> {
        const { maxRetries, delayMs } = this.config.retry;

        let lastError: unknown;

        for (let attempt = 1; attempt <= maxRetries; attempt++) { //Ретраи
            try {
                await this.mailerService.sendMail({
                    to: dto.to,
                    subject: dto.subject,
                    text: dto.text,
                    html: dto.html,
                });

                return;
            } catch (error) {
                lastError = error;

                console.error(
                    `Mail send failed (attempt ${attempt}/${maxRetries})`,
                    error,
                );

                if (attempt < maxRetries) {
                    await this.sleep(delayMs);
                }
            }
        }

        // если все попытки ретраев провалились
        throw lastError;
    }
}