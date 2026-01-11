require('dotenv').config();

const config = {
  mongodb: {
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/bd_api',
  },
  migrationsDir: 'database/migrations',
  changelogCollectionName: 'migrations',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
