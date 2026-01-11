import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
}));
