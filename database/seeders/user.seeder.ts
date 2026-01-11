import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Seeder } from './seeder.interface';
import { USER_CONSTANTS } from '../../src/modules/users/constants';

export const UserSeeder: Seeder = {
  name: 'UserSeeder',

  async run(db: mongoose.mongo.Db): Promise<void> {
    const collection = db.collection('users');

    const existingAdmin = await collection.findOne({
      email: 'admin@app.com',
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping...');
      return;
    }

    const hashedPassword = await bcrypt.hash(
      'Password123!',
      USER_CONSTANTS.PASSWORD.SALT_ROUNDS,
    );

    const now = new Date();

    await collection.insertMany([
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@app.com',
        password: hashedPassword,
        dateOfBirth: new Date('1990-01-15'),
        role: 'admin',
        location: 'Indonesia',
        timezone: 'Asia/Jakarta',
        status: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user1@app.com',
        password: hashedPassword,
        dateOfBirth: new Date('1995-06-20'),
        role: 'member',
        location: 'Indonesia',
        timezone: 'Asia/Jakarta',
        status: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log('Created 2 users (admin, member)');
  },
};
