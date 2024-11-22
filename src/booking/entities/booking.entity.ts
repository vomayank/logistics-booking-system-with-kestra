import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  deliveryAddress: string;

  @Column()
  scheduledDate: Date;

  @Column('jsonb')
  items: any[];

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ nullable: true })
  workflowExecutionId: string;
}