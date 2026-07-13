import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { CreateWatchlistItemDto } from './dto/create-watchlist-item.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.service';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    return this.watchlistService.list(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWatchlistItemDto,
  ) {
    return this.watchlistService.add(user.sub, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.watchlistService.remove(user.sub, id);
  }
}
