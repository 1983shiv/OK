import { IsString, IsOptional } from 'class-validator';

export class StrategySuggestDto {
  @IsString()
  index!: string;

  @IsString()
  @IsOptional()
  expiry?: string;
}
