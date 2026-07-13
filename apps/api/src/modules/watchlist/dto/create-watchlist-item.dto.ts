import { IsString, IsInt, IsEnum, IsDateString } from 'class-validator';

export class CreateWatchlistItemDto {
  @IsString()
  instrumentKey!: string;

  @IsString()
  symbol!: string;

  @IsInt()
  strikePrice!: number;

  @IsEnum(['CE', 'PE'])
  optionType!: 'CE' | 'PE';

  @IsDateString()
  expiryDate!: string;
}
