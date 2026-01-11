import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './controllers';
import { UsersService } from './services';
import { UserRepository } from './repositories';
import { UserMapper } from './mappers';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UserRepository, UsersService, UserMapper],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
