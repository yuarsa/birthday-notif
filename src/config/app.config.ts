import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'Birthday - API',
  host: process.env.APP_URL || 'http://localhost',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  api: {
    prefix: process.env.API_PREFIX || 'api',
    version: process.env.API_VERSION || '1',
  },
}));
