import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as nodemailer from 'nodemailer';
import type { SendMailOptions, SentMessageInfo } from 'nodemailer';

import { MailController } from '../src/mail/mail.controller';
import { MailService } from '../src/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { mailerConfig } from '../src/config/mailer.config';

describe('MailController (e2e with Ethereal)', () => {
  let app: INestApplication;
  let transporter: nodemailer.Transporter;
  let lastMessageUrl: string | false | undefined;

  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    // подавляем шум логов
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: async (
              options: SendMailOptions,
            ): Promise<SentMessageInfo> => {
              const info = await transporter.sendMail({
                from: '"Test" <test@test.com>',
                ...options,
              });

              lastMessageUrl = nodemailer.getTestMessageUrl(info);
              return info;
            },
            transporter,
          } as Partial<MailerService>,
        },
        {
          provide: mailerConfig.KEY,
          useValue: {
            retry: {
              maxRetries: 2,
              delayMs: 10,
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    consoleErrorSpy.mockRestore();
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    lastMessageUrl = undefined;
  });

  // =========================
  // SUCCESS
  // =========================

  it('should send real email via Ethereal', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'E2E Ethereal',
        text: 'Hello world',
      })
      .expect(204);

    expect(lastMessageUrl).toBeDefined();
  });

  it('should send html email', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'HTML test',
        html: '<b>Hello</b>',
      })
      .expect(204);

    expect(lastMessageUrl).toBeDefined();
  });

  // =========================
  // VALIDATION
  // =========================

  it('should fail on invalid email', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'invalid-email',
        subject: 'Test',
      })
      .expect(400);
  });

  it('should fail when subject missing', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
      })
      .expect(400);
  });

  it('should fail when no text and html', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'Empty content',
      })
      .expect(400);
  });

  // =========================
  // RETRY
  // =========================

  it('should retry and succeed', async () => {
    let attempt = 0;

    const originalSend = transporter.sendMail.bind(transporter);

    jest.spyOn(transporter, 'sendMail').mockImplementation(async (...args) => {
      attempt++;

      if (attempt === 1) {
        throw new Error('temporary fail');
      }

      return originalSend(...args);
    });

    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'Retry test',
        text: 'retry content',
      })
      .expect(204);

    expect(attempt).toBeGreaterThanOrEqual(2);
  });

  it('should fail after retries exhausted', async () => {
    jest.spyOn(transporter, 'sendMail').mockRejectedValue(
      new Error('permanent fail'),
    );

    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'Fail test',
        text: 'fail',
      })
      .expect(500);
  });
});