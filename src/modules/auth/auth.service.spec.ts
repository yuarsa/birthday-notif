import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/services';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { LoginDto } from './dto';
import { Role } from '../../common/enums';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let usersService: jest.Mocked<UsersService>;
    let jwtService: jest.Mocked<JwtService>;

    const mockUser = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        password: 'hashedpassword',
        status: true,
        firstName: 'Test',
        lastName: 'User',
        role: Role.MEMBER,
        timezone: 'UTC',
    };

    const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
    };

    const mockUsersService = {
        findByEmail: jest.fn(),
    };

    const mockJwtService = {
        signAsync: jest.fn(),
        verifyAsync: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get(UsersService);
        jwtService = module.get(JwtService);

        jest.clearAllMocks();
    });

    describe('login', () => {
        beforeEach(() => {
            (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
        });

        it('should return auth response on successful login', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser as any);
            jwtService.signAsync.mockResolvedValue('token');

            const result = await service.login(loginDto);

            expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
            expect(bcrypt.compareSync).toHaveBeenCalledWith(
                loginDto.password,
                mockUser.password,
            );
            expect(jwtService.signAsync).toHaveBeenCalled();
            expect(result).toEqual({ // Verify result structure
                accessToken: 'token',
                user: {
                    id: mockUser._id.toString(),
                    email: mockUser.email,
                    firstName: mockUser.firstName,
                    lastName: mockUser.lastName,
                    role: mockUser.role,
                    timezone: mockUser.timezone
                }
            });
        });

        it('should throw UnauthorizedException if user not found', async () => {
            usersService.findByEmail.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if user is deactivated', async () => {
            usersService.findByEmail.mockResolvedValue({
                ...mockUser,
                status: false,
            } as any);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if password does not match', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser as any);
            (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('validateToken', () => {
        it('should return payload if token is valid', async () => {
            const payload = { sub: '123' };
            jwtService.verifyAsync.mockResolvedValue(payload);

            const result = await service.validateToken('token');

            expect(result).toEqual(payload);
        });

        it('should return null if token is invalid', async () => {
            jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

            const result = await service.validateToken('token');

            expect(result).toBeNull();
        });
    });
});
