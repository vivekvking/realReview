const mongoose = require('mongoose');
const DB = {
  URL: process.env.MONGO_HOST,
  PORT: process.env.MONGO_PORT,
  NAME: process.env.MONGO_DB ?? '',
  USERNAME: process.env.MONGO_USERNAME,
  PASSWORD: process.env.MONGO_PASSWORD,
  URI: process.env.MONGO_URI,
};

const mongoOptions = {
  maxPoolSize: 200,
  // keepAlive: true,
};

let dbUri = `mongodb://${DB.USERNAME}:${DB.PASSWORD}@${DB.URL}:${DB.PORT}/${DB.NAME}`;

if (!DB.USERNAME && !DB.PASSWORD) dbUri = `mongodb://${DB.URL}:${DB.PORT}/${DB.NAME}`;

if (DB.URI) dbUri = DB.URI;

console.log('Trying to Connect to DB ..............', dbUri);
const conn = mongoose.createConnection(dbUri, mongoOptions, (err) => {
  if (err) {
    console.log('Unable to connect to database. Error: ', err);
  }
});

conn.on('connected', () => console.log('DB connected successfully'));

DB.MONGOOSE_CONN_OBJECT = conn;

module.exports = { DB };
