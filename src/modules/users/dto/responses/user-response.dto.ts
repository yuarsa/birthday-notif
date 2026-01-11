import { Role } from '../../../../common/enums';

/**
 * User Response DTO
 */
export class UserResponseDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly dateOfBirth: Date;
  readonly role: Role;
  readonly location: string;
  readonly timezone: string;
  readonly status: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * User Profile Response DTO
 */
export class UserProfileResponseDto extends UserResponseDto {
  constructor(partial: Partial<UserProfileResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
