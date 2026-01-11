import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../common/database/base.schema';
import { Role } from '../../../common/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  firstName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  lastName: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    type: Date,
    required: true,
  })
  dateOfBirth: Date;

  @Prop({
    type: String,
    enum: Role,
    default: Role.MEMBER,
  })
  role: Role;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  location: string;

  @Prop({
    type: String,
    required: true,
    default: 'UTC',
  })
  timezone: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  status: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true, name: 'email_unique_idx' });
