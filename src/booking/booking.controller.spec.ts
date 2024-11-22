import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  const mockBookingService = {
    createBooking: jest.fn(),
    getBookingStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const dto: CreateBookingDto = {
        customerId: '123',
        deliveryAddress: 'Test Address',
        scheduledDate: new Date(),
        items: [{ itemId: '1', quantity: 2 }],
      };

      const expectedResult = {
        booking: { id: '1', ...dto },
        workflowExecutionId: 'workflow-1',
      };

      mockBookingService.createBooking.mockResolvedValue(expectedResult);

      const result = await controller.createBooking(dto);
      expect(result).toEqual(expectedResult);
      expect(service.createBooking).toHaveBeenCalledWith(dto);
    });

    it('should handle errors during booking creation', async () => {
      const dto: CreateBookingDto = {
        customerId: '123',
        deliveryAddress: 'Test Address',
        scheduledDate: new Date(),
        items: [{ itemId: '1', quantity: 2 }],
      };

      const error = new Error('Booking failed');
      mockBookingService.createBooking.mockRejectedValue(error);

      await expect(controller.createBooking(dto)).rejects.toThrow();
    });
  });

  describe('getBookingStatus', () => {
    it('should return booking status successfully', async () => {
      const bookingId = '123';
      const expectedStatus = {
        booking: { id: bookingId },
        workflowStatus: { status: 'COMPLETED' },
      };

      mockBookingService.getBookingStatus.mockResolvedValue(expectedStatus);

      const result = await controller.getBookingStatus(bookingId);
      expect(result).toEqual(expectedStatus);
      expect(service.getBookingStatus).toHaveBeenCalledWith(bookingId);
    });

    it('should handle not found booking', async () => {
      const bookingId = 'non-existent';
      mockBookingService.getBookingStatus.mockRejectedValue(new Error('Booking not found'));

      await expect(controller.getBookingStatus(bookingId)).rejects.toThrow();
    });
  });
}); 