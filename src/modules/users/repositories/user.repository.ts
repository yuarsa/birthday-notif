import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { IUserRepository } from './user.repository.interface';
import { CreateUserDto, UpdateUserDto } from '../dto/requests';

/**
 * User Repository Implementation
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    data: CreateUserDto & { password: string },
  ): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find({ status: true }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();
  }

  async findByEmailWithoutPassword(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(
    id: string,
    data: Partial<UpdateUserDto>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    return result !== null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userModel
      .countDocuments({ email: email.toLowerCase() })
      .exec();

    return count > 0;
  }

  async findUsersForBirthdayNotif(
    dateField: string,
    targetHour: number,
    batchSize: number,
    lastId?: Types.ObjectId,
  ): Promise<UserDocument[]> {
    const now = new Date();
    const dateFieldRef = `$${dateField}`;

    const pipeline: PipelineStage[] = [
      { $match: { status: true } },
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: [
                  { $hour: { date: now, timezone: '$timezone' } },
                  targetHour,
                ],
              },
              {
                $eq: [
                  { $month: { date: dateFieldRef, timezone: '$timezone' } },
                  { $month: { date: now, timezone: '$timezone' } },
                ],
              },
              {
                $eq: [
                  {
                    $dayOfMonth: {
                      date: dateFieldRef,
                      timezone: '$timezone',
                    },
                  },
                  { $dayOfMonth: { date: now, timezone: '$timezone' } },
                ],
              },
            ],
          },
        },
      },
      { $sort: { _id: 1 } },
    ];

    if (lastId) {
      pipeline.push({
        $match: { _id: { $gt: lastId } },
      });
    }

    pipeline.push({ $limit: batchSize });

    return this.userModel.aggregate(pipeline);
  }
}
