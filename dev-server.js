/**
 * Local development entrypoint.
 *
 * There is no mongod (and no Docker) on a fresh machine, so this boots an
 * ephemeral MongoDB via mongodb-memory-server and points the app at it before
 * anything requires the connector - utils/connectors/mongo.js reads
 * process.env at require time, so the URI has to exist first.
 *
 * Data is kept in .devdb/ rather than a temp dir so restarts don't wipe
 * whatever you were looking at. Delete that folder for a clean slate.
 *
 *   npm run dev:local        start with a persistent local DB
 *   npm run seed             (re)populate it with demo data
 *
 * Production still runs `node app.js` against a real MONGO_URI.
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const DB_PATH = path.join(__dirname, '.devdb');
const DB_NAME = 'realReview';

const start = async () => {
  if (process.env.MONGO_URI) {
    console.log('MONGO_URI already set - using the configured database');
  } else {
    fs.mkdirSync(DB_PATH, { recursive: true });
    console.log('Starting local MongoDB (first run downloads a mongod binary)...');

    const mongod = await MongoMemoryServer.create({
      instance: { dbPath: DB_PATH, storageEngine: 'wiredTiger', dbName: DB_NAME },
    });

    process.env.MONGO_URI = mongod.getUri(DB_NAME);
    console.log('Local MongoDB ready at', process.env.MONGO_URI);

    const shutdown = async () => {
      await mongod.stop();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  process.env.PORT = process.env.PORT || 8000;
  process.env.PROJECT_ENV = process.env.PROJECT_ENV || 'dev';
  process.env.JWT_ACCESS_HASH_KEY = process.env.JWT_ACCESS_HASH_KEY || 'dev-access-key-not-for-production';
  process.env.JWT_REFRESH_HASH_KEY = process.env.JWT_REFRESH_HASH_KEY || 'dev-refresh-key-not-for-production';

  const { seed, seedIfEmpty } = require('./scripts/seed');
  if (process.env.SEED === 'force') await seed();
  else await seedIfEmpty();

  require('./app');
};

start().catch((err) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
