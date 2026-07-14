import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AiChatDto {
  @IsString()
  query!: string;

  @IsString()
  @IsOptional()
  index?: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;
}
