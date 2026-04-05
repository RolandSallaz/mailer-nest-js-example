import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendEmailDto } from './dto/SendEmail.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) { }


  @Post('send') //HTTP запросы используем как временное решение. Правильнее получать запросы из кафки
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendEmail(@Body() dto: SendEmailDto): Promise<void> {
    await this.mailService.sendEmail(dto);
  }
}
