import mongoose from 'mongoose';

export interface Seeder {
  name: string;
  run(db: mongoose.mongo.Db): Promise<void>;
}
