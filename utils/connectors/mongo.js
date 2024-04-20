const mongoose = require('mongoose');
const DB = {
  URL: process.env.MONGO_HOST,
  PORT: process.env.MONGO_PORT,
  NAME: process.env.MONGO_DB,
  USERNAME: process.env.MONGO_USERNAME,
  PASSWORD: process.env.MONGO_PASSWORD,
};

const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 200,
  // keepAlive: true,
};
let dbUri = `mongodb://${DB.USERNAME}:${DB.PASSWORD}@${DB.URL}:${DB.PORT}/${DB.NAME}`;

if(!DB.USERNAME && !DB.PASSWORD)
  dbUri = `mongodb://${DB.URL}:${DB.PORT}/${DB.NAME}`;

const conn = mongoose.createConnection(dbUri, mongoOptions, (err) => {
  if (err) {
    console.log('Unable to connect to database. Error: ', err);
  }
  console.log('Database Connected Successfully!');
});

DB.MONGOOSE_CONN_OBJECT = conn;

module.exports = { DB };
