import { validate } from 'class-validator';
import { CreateBookingDto, BookingItemDto } from './create-booking.dto';
import { plainToClass } from 'class-transformer';

describe('CreateBookingDto', () => {
  it('should validate a valid booking DTO', async () => {
    const dto = plainToClass(CreateBookingDto, {
      customerId: 'test123',
      deliveryAddress: 'wtc 123',
      scheduledDate: '2024-11-10T16:33:27.603Z',
      items: [{ itemId: 'milk', quantity: 10 }]
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform date string to Date object', async () => {
    const dto = plainToClass(CreateBookingDto, {
      scheduledDate: '2024-11-10T16:33:27.603Z'
    });

    expect(dto.scheduledDate).toBeInstanceOf(Date);
  });
}); 