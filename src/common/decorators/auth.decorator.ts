import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '../enums/role.enum';
import { Roles } from './roles.decorator';

/**
 * Decorator for Authentication and Authorization
 *
 * @param roles - Array of Role enum values. If empty, only authentication is required.
 */
export function Auth(...roles: Role[]) {
  if (roles.length === 0) {
    return applyDecorators(UseGuards(JwtAuthGuard));
  }

  // If specific roles are provided
  return applyDecorators(Roles(...roles), UseGuards(JwtAuthGuard, RolesGuard));
}
