import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository } from '../repositories';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from '../dto/requests';
import { Role } from '../../../common/enums';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UserRepository>;

  const mockUser = {
    _id: new Types.ObjectId(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedpassword',
    location: 'Jakarta',
    timezone: 'Asia/Jakarta',
  };

  const mockUserRepository = {
    existsByEmail: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UserRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      location: 'Jakarta',
      timezone: 'Asia/Jakarta',
      role: Role.MEMBER,
      dateOfBirth: new Date('1990-01-01'),
    };

    it('should create a new user successfully', async () => {
      repository.existsByEmail.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      repository.create.mockResolvedValue(mockUser as any);

      const result = await service.create(createUserDto);

      expect(repository.existsByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createUserDto.email.toLowerCase(),
          password: 'hashedpassword',
        }),
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      repository.existsByEmail.mockResolvedValue(true);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      repository.findAll.mockResolvedValue([mockUser] as any);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      repository.findByEmail.mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('john@example.com');

      expect(repository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      repository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('john@example.com');

      expect(repository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      repository.findById.mockResolvedValue(mockUser as any);

      const result = await service.findById(mockUser._id.toString());

      expect(repository.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if invalid ID format', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(mockUser._id.toString())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Jane',
    };

    it('should update user successfully', async () => {
      repository.findById.mockResolvedValue(mockUser as any);
      repository.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      } as any);

      const result = await service.update(
        mockUser._id.toString(),
        updateUserDto,
      );

      expect(repository.update).toHaveBeenCalledWith(
        mockUser._id.toString(),
        expect.objectContaining({ firstName: 'Jane' }),
      );
      expect(result.firstName).toBe('Jane');
    });

    it('should hash password if provided in update', async () => {
      repository.findById.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');
      repository.update.mockResolvedValue(mockUser as any);

      await service.update(mockUser._id.toString(), {
        password: 'newpassword',
      });

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(
        mockUser._id.toString(),
        expect.objectContaining({ password: 'newhashedpassword' }),
      );
    });

    it('should throw NotFoundException if user not found during update', async () => {
      // First findById call succeeds
      repository.findById.mockResolvedValue(mockUser as any);
      // But update returns null (e.g. concurrent delete)
      repository.update.mockResolvedValue(null);

      await expect(
        service.update(mockUser._id.toString(), updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if findById fails', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(mockUser._id.toString(), updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      repository.delete.mockResolvedValue(true);

      await service.delete(mockUser._id.toString());

      expect(repository.delete).toHaveBeenCalledWith(mockUser._id.toString());
    });

    it('should throw NotFoundException if user to delete not found', async () => {
      repository.delete.mockResolvedValue(false);

      await expect(service.delete(mockUser._id.toString())).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
