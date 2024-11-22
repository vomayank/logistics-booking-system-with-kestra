import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingModule } from './booking/booking.module';
import { KestraModule } from './kestra/kestra.module';
import { Booking } from './booking/entities/booking.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'logistics_db'),
        entities: [Booking],
        synchronize: true, // Only use this in development
        logging: true,
      }),
      inject: [ConfigService],
    }),
    BookingModule,
    KestraModule,
  ],
})
export class AppModule {}