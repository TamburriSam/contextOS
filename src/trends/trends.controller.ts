import { Controller, Get } from '@nestjs/common';
import { TrendsService } from './trends.service';

@Controller('trends')
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  @Get('top')
  getTopClusters() {
    return this.trendsService.getTopClusters();
  }

  @Get('ticker')
  getRisingTopics() {
    return this.trendsService.getRisingTopics();
  }
}