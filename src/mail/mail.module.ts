import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig, TMailerConfig } from 'src/config/mailer.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forFeature(mailerConfig),
    MailerModule.forRootAsync({
      inject: [mailerConfig.KEY],
      useFactory: (config: TMailerConfig) => ({
        transport: config.transport,
        defaults: config.defaults,
      })
    })
  ],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule { }
