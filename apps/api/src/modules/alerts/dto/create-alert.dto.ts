import {
  IsString,
  IsInt,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateAlertDto {
  @IsEnum(['OI_SPIKE', 'PCR_CROSS', 'MAX_PAIN_SHIFT', 'WATCHLIST'])
  alertType!: 'OI_SPIKE' | 'PCR_CROSS' | 'MAX_PAIN_SHIFT' | 'WATCHLIST';

  @IsString()
  symbol!: string;

  @IsOptional()
  @IsInt()
  strikePrice?: number;

  @IsOptional()
  @IsEnum(['CE', 'PE'])
  optionType?: 'CE' | 'PE';

  @IsEnum(['GT', 'LT', 'CROSS_ABOVE', 'CROSS_BELOW'])
  conditionOperator!: 'GT' | 'LT' | 'CROSS_ABOVE' | 'CROSS_BELOW';

  @IsNumber()
  conditionValue!: number;

  @IsArray()
  @IsEnum(['IN_APP', 'EMAIL', 'PUSH', 'TELEGRAM'], { each: true })
  deliveryChannels!: ('IN_APP' | 'EMAIL' | 'PUSH' | 'TELEGRAM')[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
