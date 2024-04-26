const express = require('express');
const app = express();
const morgan = require('morgan');
require('dotenv').config();

app.use(morgan('dev'))
app.use(express.json());
const cors = require('cors');
const reviewRoutes = require('./review');
const productRoutes = require('./product');
const userRoutes = require('./user');
const { sendResponse } = require('./utils/helpers/helper');
const { handleAppError } = require('./utils/helpers/error');

//CORS Setup
const dynamicCORS = () => {
  const origin = process.env.PROJECT_ENV == 'dev' ? JSON.parse(process.env.CORS_ORIGIN).push('http://localhost:3000') : process.env.CORS_ORIGIN;
  return origin;
};

const options = {
  origin: dynamicCORS(),
  allowedHeaders: 'Content-Type, Authorization,Origin,User-Agent,X-Requested-With',
  methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'DELETE'],
};
app.use(cors(options));

app.use('/review', reviewRoutes);
app.use('/product', productRoutes);
app.use('/user', userRoutes);

app.use('/', (req, res) => {
  res.send('Heyyy Server Started');
});

app.use((err, req, res, next) => {
  try {
    console.log("Error occured ", err)
    let status = err?.status || 500;
    let data = err?.data || {};
    let message = err?.description || err?.message;
    return sendResponse(res, status, data, message ?? '');
  } catch (err) {
    handleAppError({ err });
  }
});

app.listen(process.env.PORT, () => {
  console.log('Server started on port ', process.env.PORT);
});
