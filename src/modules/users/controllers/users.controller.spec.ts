import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services';
import { UserMapper } from '../mappers';
import { CreateUserDto, UpdateUserDto } from '../dto/requests';
import { Role } from '../../../common/enums';
import { Types } from 'mongoose';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;
  let mapper: jest.Mocked<UserMapper>;

  const mockUser = {
    _id: new Types.ObjectId(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: Role.MEMBER,
  };

  const mockUserResponse = {
    id: mockUser._id.toString(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    fullName: 'John Doe',
    role: Role.MEMBER,
    location: 'Jakarta',
    timezone: 'Asia/Jakarta',
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserMapper = {
    toResponseDto: jest.fn(),
    toResponseDtoList: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UserMapper,
          useValue: mockUserMapper,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
    mapper = module.get(UserMapper);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user and return response', async () => {
      const dto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password',
        location: 'Jakarta',
        timezone: 'Asia/Jakarta',
        role: Role.MEMBER,
        dateOfBirth: new Date('1990-01-01'),
      };

      service.create.mockResolvedValue(mockUser as any);
      mapper.toResponseDto.mockReturnValue(mockUserResponse as any);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(mapper.toResponseDto).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        success: true,
        message: 'User created successfully',
        data: mockUserResponse,
      });
    });
  });

  describe('findAll', () => {
    it('should return list of users', async () => {
      service.findAll.mockResolvedValue([mockUser] as any);
      mapper.toResponseDtoList.mockReturnValue([mockUserResponse] as any);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(mapper.toResponseDtoList).toHaveBeenCalledWith([mockUser]);
      expect(result.data).toEqual([mockUserResponse]);
    });
  });

  describe('findOne', () => {
    it('should return a user details', async () => {
      service.findById.mockResolvedValue(mockUser as any);
      mapper.toResponseDto.mockReturnValue(mockUserResponse as any);

      const result = await controller.findOne('someid');

      expect(service.findById).toHaveBeenCalledWith('someid');
      expect(result.data).toEqual(mockUserResponse);
    });
  });

  describe('update', () => {
    it('should update user and return details', async () => {
      const dto: UpdateUserDto = { firstName: 'Jane' };
      service.update.mockResolvedValue(mockUser as any);
      mapper.toResponseDto.mockReturnValue(mockUserResponse as any);

      const result = await controller.update('someid', dto);

      expect(service.update).toHaveBeenCalledWith('someid', dto);
      expect(result.data).toEqual(mockUserResponse);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      service.delete.mockResolvedValue(undefined);

      const result = await controller.delete('someid');

      expect(service.delete).toHaveBeenCalledWith('someid');
      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
        data: null,
      });
    });
  });
});
