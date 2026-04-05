import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { mailerConfig } from './config/mailer.config';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [mailerConfig]
    }),
    MailModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
