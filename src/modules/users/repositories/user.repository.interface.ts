import { CreateUserDto, UpdateUserDto } from '../dto/requests';
import { UserDocument } from '../schemas/user.schema';
import { Types } from 'mongoose';

/**
 * User Repository Interface
 */
export interface IUserRepository {
  create(data: CreateUserDto & { password: string }): Promise<UserDocument>;

  findAll(): Promise<UserDocument[]>;

  findById(id: string): Promise<UserDocument | null>;

  findByEmail(email: string): Promise<UserDocument | null>;

  findByEmailWithoutPassword(email: string): Promise<UserDocument | null>;

  update(
    id: string,
    data: Partial<UpdateUserDto>,
  ): Promise<UserDocument | null>;

  delete(id: string): Promise<boolean>;

  existsByEmail(email: string): Promise<boolean>;

  findUsersForBirthdayNotif(
    dateField: string,
    targetHour: number,
    batchSize: number,
    lastId?: Types.ObjectId,
  ): Promise<UserDocument[]>;
}
