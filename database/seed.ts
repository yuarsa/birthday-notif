import 'dotenv/config';
import mongoose from 'mongoose';
import { seeders } from './seeders';

interface SeederRecord {
  name: string;
  executedAt: Date;
}

class SeederRunner {
  private db: mongoose.mongo.Db;
  private client: mongoose.mongo.MongoClient;
  private readonly collectionName = 'seeders';

  async connect(): Promise<void> {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bd_api';

    this.client = new mongoose.mongo.MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();

    console.log(`Connected to database: ${this.db.databaseName}`);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('Disconnected from database');
  }

  async getExecutedSeeders(): Promise<string[]> {
    const collection = this.db.collection<SeederRecord>(this.collectionName);
    const records = await collection.find({}).toArray();

    return records.map((r) => r.name);
  }

  async markAsExecuted(name: string): Promise<void> {
    const collection = this.db.collection<SeederRecord>(this.collectionName);

    await collection.insertOne({
      name,
      executedAt: new Date(),
    });
  }

  async run(fresh = false): Promise<void> {
    await this.connect();

    try {
      if (fresh) {
        console.log('\n Fresh seeding - clearing seeder history...');
        await this.db.collection(this.collectionName).deleteMany({});
      }

      const executed = await this.getExecutedSeeders();
      const pending = seeders.filter((s) => !executed.includes(s.name));

      if (pending.length === 0) {
        console.log('\n Nothing to seed. All seeders have been executed.');
        return;
      }

      console.log(`\n Running ${pending.length} seeder(s)...\n`);

      for (const seeder of pending) {
        console.log(`Running: ${seeder.name}`);

        await seeder.run(this.db);
        await this.markAsExecuted(seeder.name);

        console.log(`${seeder.name} completed\n`);
      }

      console.log('All seeders completed successfully!');
    } finally {
      await this.disconnect();
    }
  }

  async status(): Promise<void> {
    await this.connect();

    try {
      const executed = await this.getExecutedSeeders();

      console.log('\n Seeder Status:\n');
      console.log('Executed:');

      if (executed.length === 0) {
        console.log('  (none)');
      } else {
        executed.forEach((name) => console.log(`  ✓ ${name}`));
      }

      const pending = seeders.filter((s) => !executed.includes(s.name));

      console.log('\n Pending:');

      if (pending.length === 0) {
        console.log('  (none)');
      } else {
        pending.forEach((s) => console.log(`  ○ ${s.name}`));
      }
    } finally {
      await this.disconnect();
    }
  }
}

async function main(): Promise<void> {
  const runner = new SeederRunner();
  const command = process.argv[2];

  switch (command) {
    case 'fresh':
      await runner.run(true);
      break;
    case 'status':
      await runner.status();
      break;
    default:
      await runner.run(false);
  }
}

main().catch((error) => {
  console.error('Seeder failed:', error);
  process.exit(1);
});
