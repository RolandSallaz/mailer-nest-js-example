import { IsEmail, IsString, MinLength, ValidateIf } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  @MinLength(1)
  subject!: string;

  @ValidateIf((o) => !o.html)
  @IsString()
  @MinLength(1)
  text?: string;

  @ValidateIf((o) => !o.text)
  @IsString()
  @MinLength(1)
  html?: string;
}