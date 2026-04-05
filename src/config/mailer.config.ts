import { MailerOptions } from "@nestjs-modules/mailer";
import { ConfigType, registerAs } from "@nestjs/config";
import * as dotenv from 'dotenv';
import { MailerAsyncOptions } from "node_modules/@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface";

dotenv.config();

export const mailerConfig = registerAs('MAILER_CONFIG', () => {
    const port = parseInt(process.env.MAIL_PORT || '465', 10);

    return {
        transport: {
            host: process.env.MAIL_HOST || 'smtp.yandex.ru',
            port,
            secure: process.env.MAIL_SECURE
                ? process.env.MAIL_SECURE === 'true'
                : port === 465,
            auth: {
                user: process.env.MAIL_USER || '',
                pass: process.env.MAIL_PASSWORD || '',
            },
        },
        defaults: {
            from:
                process.env.MAIL_FROM ||
                '"No Reply" <noreply@example.com>',
        },
        retry: {
            maxRetries: parseInt(process.env.MAIL_MAX_RETRIES || '3', 10),
            delayMs: parseInt(process.env.MAIL_RETRY_DELAY_MS || '1000', 10),
        },
    };
});

export type TMailerConfig = ConfigType<typeof mailerConfig>;