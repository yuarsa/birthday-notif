import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../services';
import { UserMapper } from '../mappers';
import { Role } from '../../../common/enums';
import { CreateUserDto, UpdateUserDto } from '../dto/requests';
import { ApiSuccessResponse } from '../../../common/interfaces';
import { UserResponseDto } from '../dto/responses';
import { Auth } from '../../../common/decorators/auth.decorator';

/**
 * Users Controller
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userMapper: UserMapper,
  ) {}

  /**
   * Create a new user
   */
  @Post()
  @Auth(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiSuccessResponse<UserResponseDto>> {
    const user = await this.usersService.create(createUserDto);

    return {
      success: true,
      message: 'User created successfully',
      data: this.userMapper.toResponseDto(user),
    };
  }

  /**
   * Find all active users
   */
  @Get()
  @Auth(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiSuccessResponse<UserResponseDto[]>> {
    const users = await this.usersService.findAll();

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: this.userMapper.toResponseDtoList(users),
    };
  }

  /**
   * Find user by ID
   */
  @Get(':id')
  @Auth(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiSuccessResponse<UserResponseDto>> {
    const user = await this.usersService.findById(id);

    return {
      success: true,
      message: 'User retrieved successfully',
      data: this.userMapper.toResponseDto(user),
    };
  }

  /**
   * Update user
   */
  @Put(':id')
  @Auth(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiSuccessResponse<UserResponseDto>> {
    const user = await this.usersService.update(id, updateUserDto);

    return {
      success: true,
      message: 'User updated successfully',
      data: this.userMapper.toResponseDto(user),
    };
  }

  /**
   * Delete user
   */
  @Delete(':id')
  @Auth(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<ApiSuccessResponse<null>> {
    await this.usersService.delete(id);

    return {
      success: true,
      message: 'User deleted successfully',
      data: null,
    };
  }
}
