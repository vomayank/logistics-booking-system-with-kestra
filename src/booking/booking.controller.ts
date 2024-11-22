import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'The booking has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createBooking(@Body() createBookingDto: CreateBookingDto) {
    try {
      return await this.bookingService.createBooking(createBookingDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get booking status' })
  @ApiResponse({ status: 200, description: 'Returns the booking status.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async getBookingStatus(@Param('id') id: string) {
    try {
      return await this.bookingService.getBookingStatus(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
} 