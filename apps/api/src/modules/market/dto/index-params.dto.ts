import { IsString, IsIn, IsOptional } from 'class-validator';

export class IndexParamsDto {
  @IsString()
  @IsIn(['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'])
  index!: string;
}

export class ChainQueryDto {
  @IsString()
  @IsOptional()
  expiry?: string;
}
