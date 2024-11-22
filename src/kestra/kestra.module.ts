import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { KestraService } from './kestra.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [KestraService],
  exports: [KestraService],
})
export class KestraModule {} 