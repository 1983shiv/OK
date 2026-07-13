import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsString()
  @IsOptional()
  theme?: string;

  @IsString()
  @IsOptional()
  defaultIndex?: string;

  @IsString()
  @IsOptional()
  defaultExpiry?: string;

  @IsBoolean()
  @IsOptional()
  notifications?: boolean;

  @IsBoolean()
  @IsOptional()
  emailAlerts?: boolean;
}
