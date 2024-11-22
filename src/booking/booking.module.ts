import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { KestraModule } from '../kestra/kestra.module';
@Module({
imports: [
TypeOrmModule.forFeature([Booking]),
KestraModule,
],
controllers: [BookingController],
providers: [BookingService],
})
export class BookingModule {}