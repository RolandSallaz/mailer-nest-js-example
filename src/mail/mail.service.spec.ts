import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { mailerConfig } from '../config/mailer.config';

describe('MailService', () => {
  let service: MailService;
  let mailerService: jest.Mocked<MailerService>;

  const mockConfig = {
    retry: {
      maxRetries: 3,
      delayMs: 10,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
            transporter: {
              verify: jest.fn(),
            },
          },
        },
        {
          provide: mailerConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get(MailService);
    mailerService = module.get(MailerService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================
  // sendEmail
  // =========================

  it('should send email successfully', async () => {
    mailerService.sendMail.mockResolvedValueOnce({} as any);

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'Test',
      text: 'Hello',
    });

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'test@mail.com',
      subject: 'Test',
      text: 'Hello',
      html: undefined,
    });
  });

  it('should support html email', async () => {
    mailerService.sendMail.mockResolvedValueOnce({} as any);

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'HTML',
      html: '<b>Hello</b>',
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<b>Hello</b>',
      }),
    );
  });

  it('should retry and succeed on last attempt', async () => {
    mailerService.sendMail
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce({} as any);

    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'Retry Test',
    });

    expect(mailerService.sendMail).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenCalledTimes(2);
  });

  it('should not retry if first attempt succeeds', async () => {
    mailerService.sendMail.mockResolvedValueOnce({} as any);

    const sleepSpy = jest.spyOn(service as any, 'sleep');

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'Fast success',
    });

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(sleepSpy).not.toHaveBeenCalled();
  });

  it('should throw after all retries fail', async () => {
    mailerService.sendMail.mockRejectedValue(new Error('fail'));

    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);

    await expect(
      service.sendEmail({
        to: 'test@mail.com',
        subject: 'Fail test',
      }),
    ).rejects.toThrow('fail');

    expect(mailerService.sendMail).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenCalledTimes(2);
  });

  it('should work with single retry config', async () => {
    const singleRetryConfig = {
      retry: { maxRetries: 1, delayMs: 10 },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockRejectedValue(new Error('fail')),
          },
        },
        {
          provide: mailerConfig.KEY,
          useValue: singleRetryConfig,
        },
      ],
    }).compile();

    const localService = module.get(MailService);

    await expect(
      localService.sendEmail({
        to: 'test@mail.com',
        subject: 'One try',
      }),
    ).rejects.toThrow();

    const localMailer = module.get(MailerService) as any;

    expect(localMailer.sendMail).toHaveBeenCalledTimes(1);
  });

  // =========================
  // verifyConnection
  // =========================

  it('should verify SMTP connection on init', async () => {
    const verifyMock = jest.fn().mockResolvedValue(true);
    (mailerService as any).transporter.verify = verifyMock;

    await service.onModuleInit();

    expect(verifyMock).toHaveBeenCalled();
  });

  it('should handle missing transporter gracefully', async () => {
    (mailerService as any).transporter = null;

    await expect(service.onModuleInit()).resolves.not.toThrow();
  });

  it('should log error if verify fails', async () => {
    const error = new Error('SMTP fail');

    const verifyMock = jest.fn().mockRejectedValue(error);
    (mailerService as any).transporter.verify = verifyMock;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await service.onModuleInit();

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // =========================
  // edge cases
  // =========================

  it('should propagate last error correctly', async () => {
    const error = new Error('final error');
    mailerService.sendMail.mockRejectedValue(error);

    await expect(
      service.sendEmail({
        to: 'test@mail.com',
        subject: 'Error test',
      }),
    ).rejects.toBe(error);
  });
});