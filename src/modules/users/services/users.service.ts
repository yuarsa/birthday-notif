import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../schemas/user.schema';
import { UserRepository } from '../repositories';

import { USER_CONSTANTS } from '../constants';
import { CreateUserDto, UpdateUserDto } from '../dto/requests';

/**
 * Users Service
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const isExists = await this.userRepository.existsByEmail(
      createUserDto.email,
    );

    if (isExists) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);

    const user = await this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });

    this.logger.log(`User created: ${user.email}`);

    return user;
  }

  /**
   * Find all active users
   */
  async findAll(): Promise<UserDocument[]> {
    return this.userRepository.findAll();
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserDocument> {
    this.validateObjectId(id);

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Update user
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    await this.findById(id);

    const updateData = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await this.hashPassword(updateUserDto.password);
    }

    const updatedUser = await this.userRepository.update(id, updateData);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, USER_CONSTANTS.PASSWORD.SALT_ROUNDS);
  }

  /**
   * Validate MongoDB ObjectId format
   */
  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }
  }
}
