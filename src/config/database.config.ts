import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGO_URI,
  debug: process.env.NODE_ENV !== 'production',
}));
