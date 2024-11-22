import { IsNotEmpty, IsString, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BookingItemDto {
  @ApiProperty({ description: 'The ID of the item' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: 'The quantity of the item' })
  @IsNotEmpty()
  quantity: number;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'The ID of the customer' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'The delivery address' })
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ description: 'The scheduled delivery date' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  scheduledDate: Date;

  @ApiProperty({ 
    description: 'Array of items to be delivered',
    type: [BookingItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items: BookingItemDto[];
} 