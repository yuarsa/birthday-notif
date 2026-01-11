import { Injectable } from '@nestjs/common';
import { UserDocument } from '../schemas/user.schema';
import { UserProfileResponseDto, UserResponseDto } from '../dto/responses';

/**
 * Transforms User entities to specific response
 */
@Injectable()
export class UserMapper {
  /**
   * User with excludes sensitive fields
   */
  toResponseDto(user: UserDocument): UserResponseDto {
    return new UserResponseDto({
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      location: user.location,
      timezone: user.timezone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * User profile
   */
  toProfileResponseDto(user: UserDocument): UserProfileResponseDto {
    return new UserProfileResponseDto({
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      location: user.location,
      timezone: user.timezone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * User in array format
   */
  toResponseDtoList(users: UserDocument[]): UserResponseDto[] {
    return users.map((user) => this.toResponseDto(user));
  }

  /**
   * User profile in array format
   */
  toProfileResponseDtoList(users: UserDocument[]): UserProfileResponseDto[] {
    return users.map((user) => this.toProfileResponseDto(user));
  }
}
