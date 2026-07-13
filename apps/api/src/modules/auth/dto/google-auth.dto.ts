import { IsString, MinLength, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @IsOptional()
  redirectUri?: string;
}
