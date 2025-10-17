import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrendsModule } from './trends/trends.module';

@Module({
  imports: [TrendsModule],
})
export class AppModule {}