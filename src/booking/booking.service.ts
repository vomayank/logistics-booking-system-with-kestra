import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { KestraService } from '../kestra/kestra.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly kestraService: KestraService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto) {
    // Create and save booking record first
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      status: 'PENDING',
    });
    const savedBooking = await this.bookingRepository.save(booking);

    try {
      // Trigger Kestra workflow with saved booking ID
      this.logger.debug('Saved booking:', savedBooking);
      const workflowResponse = await this.kestraService.triggerWorkflow(
        'logistics-booking-flow',
        'logistics',
        {
          bookingId: savedBooking.id,
          customerId: savedBooking.customerId,
          deliveryAddress: savedBooking.deliveryAddress,
          scheduledDate: savedBooking.scheduledDate,
          items: savedBooking.items,
        },
      );

      // Update booking with workflow execution ID
      savedBooking.workflowExecutionId = workflowResponse.executionId;
      savedBooking.status = 'PROCESSING';
      await this.bookingRepository.save(savedBooking);

      return {
        booking: savedBooking,
        workflowExecutionId: workflowResponse.executionId,
      };
    } catch (error) {
      savedBooking.status = 'FAILED';
      await this.bookingRepository.save(savedBooking);
      throw error;
    }
  }

  async getBookingStatus(id: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.workflowExecutionId) {
      const workflowStatus = await this.kestraService.getWorkflowStatus(
        booking.workflowExecutionId,
      );
      return {
        booking,
        workflowStatus,
      };
    }

    return { booking };
  }
} 