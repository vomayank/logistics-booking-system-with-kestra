import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { KestraService } from '../kestra/kestra.service';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: Repository<Booking>;
  let kestraService: KestraService;

  const mockBookingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockKestraService = {
    triggerWorkflow: jest.fn(),
    getWorkflowStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: KestraService,
          useValue: mockKestraService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingRepository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    kestraService = module.get<KestraService>(KestraService);
  });

  describe('createBooking', () => {
    it('should create booking and trigger workflow successfully', async () => {
      const createBookingDto = {
        customerId: '123',
        deliveryAddress: 'Test Address',
        scheduledDate: new Date(),
        items: [{ itemId: '1', quantity: 2 }],
      };

      const mockBooking = {
        id: '1',
        ...createBookingDto,
        status: 'PENDING',
      };

      const mockWorkflowResponse = {
        executionId: 'workflow-1',
        state: 'RUNNING',
      };

      mockBookingRepository.create.mockReturnValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue(mockBooking);
      mockKestraService.triggerWorkflow.mockResolvedValue(mockWorkflowResponse);

      const result = await service.createBooking(createBookingDto);

      expect(result).toHaveProperty('booking');
      expect(result).toHaveProperty('workflowExecutionId');
      expect(mockBookingRepository.save).toHaveBeenCalled();
      expect(mockKestraService.triggerWorkflow).toHaveBeenCalled();
    });

    it('should handle workflow trigger failure', async () => {
      const createBookingDto = {
        customerId: '123',
        deliveryAddress: 'Test Address',
        scheduledDate: new Date(),
        items: [{ itemId: '1', quantity: 2 }],
      };

      const error = new Error('Workflow trigger failed');
      mockKestraService.triggerWorkflow.mockRejectedValue(error);

      await expect(service.createBooking(createBookingDto)).rejects.toThrow();
    });

    it('should handle database error during booking creation', async () => {
      const createBookingDto = {
        customerId: '123',
        deliveryAddress: 'Test Address',
        scheduledDate: new Date(),
        items: [{ itemId: '1', quantity: 2 }],
      };

      mockBookingRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createBooking(createBookingDto)).rejects.toThrow('Database error');
    });

    it('should handle workflow trigger success but database update failure', async () => {
      const createBookingDto = {
        customerId: '123',
        deliveryAddress: 'Test Address',
        scheduledDate: new Date(),
        items: [{ itemId: '1', quantity: 2 }],
      };

      const mockBooking = {
        id: '1',
        ...createBookingDto,
        status: 'PENDING',
      };

      const mockWorkflowResponse = {
        executionId: 'workflow-1',
        state: 'RUNNING',
      };

      mockBookingRepository.create.mockReturnValue(mockBooking);
      mockBookingRepository.save
        .mockResolvedValueOnce(mockBooking)  // First save succeeds
        .mockRejectedValueOnce(new Error('Database error')); // Second save fails
      mockKestraService.triggerWorkflow.mockResolvedValue(mockWorkflowResponse);

      await expect(service.createBooking(createBookingDto)).rejects.toThrow('Database error');
      expect(mockBooking.status).toBe('FAILED');
    });
  });

  describe('getBookingStatus', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });

    it('should return booking status successfully', async () => {
      const bookingId = '123';
      const mockBooking = {
        id: bookingId,
        workflowExecutionId: 'workflow-1',
        status: 'PROCESSING'
      };

      const mockWorkflowStatus = {
        id: 'workflow-1',
        state: {
          current: 'COMPLETED'
        }
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockKestraService.getWorkflowStatus.mockResolvedValue(mockWorkflowStatus);

      const result = await service.getBookingStatus(bookingId);
      expect(result).toEqual({
        booking: mockBooking,
        workflowStatus: mockWorkflowStatus
      });
      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({ where: { id: bookingId } });
    });

    it('should handle not found booking', async () => {
      const bookingId = 'non-existent';
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.getBookingStatus(bookingId)).rejects.toThrow();
    });

    it('should return booking without workflow status when no executionId exists', async () => {
      const bookingId = '123';
      const mockBooking = {
        id: bookingId,
        workflowExecutionId: null,
        status: 'PENDING'
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.getBookingStatus(bookingId);
      expect(result).toEqual({ booking: mockBooking });
      expect(mockKestraService.getWorkflowStatus).not.toHaveBeenCalled();
    });

    it('should return booking with workflow status when executionId exists', async () => {
      const bookingId = '123';
      const mockBooking = {
        id: bookingId,
        workflowExecutionId: 'workflow-1',
        status: 'PROCESSING'
      };

      const mockWorkflowStatus = {
        id: 'workflow-1',
        state: {
          current: 'COMPLETED'
        }
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockKestraService.getWorkflowStatus.mockResolvedValue(mockWorkflowStatus);

      const result = await service.getBookingStatus(bookingId);
      expect(result).toEqual({
        booking: mockBooking,
        workflowStatus: mockWorkflowStatus
      });
    });

    it('should handle booking not found', async () => {
      const bookingId = 'non-existent';
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.getBookingStatus(bookingId))
        .rejects
        .toThrow('Booking not found');
    });

    it('should handle workflow status check failure', async () => {
      const bookingId = '123';
      const mockBooking = {
        id: bookingId,
        workflowExecutionId: 'workflow-1',
        status: 'PROCESSING'
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockKestraService.getWorkflowStatus.mockRejectedValue(new Error('Workflow status check failed'));

      await expect(service.getBookingStatus(bookingId))
        .rejects
        .toThrow('Workflow status check failed');
    });
  });
}); 