const express = require('express');
const app = express();
const morgan = require('morgan');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
require('dotenv').config();

app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Rate limit exceeded',
  }),
);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(express.json());
const cors = require('cors');
const reviewRoutes = require('./review');
const productRoutes = require('./product');
const userRoutes = require('./user');
const { sendResponse } = require('./utils/helpers/helper');
const { handleAppError } = require('./utils/helpers/error');

// CORS Setup
const corsOptions = {
  origin: process.env.PROJECT_ENV === 'prod' 
    ? process.env.CORS_ORIGIN || '*'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'User-Agent', 'X-Requested-With'],
  methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'DELETE'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200
};

// Apply CORS middleware before routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use('/review', reviewRoutes);
app.use('/product', productRoutes);
app.use('/user', userRoutes);

app.use('/', (req, res) => {
  res.send('Heyyy Server Started');
});

app.use((err, req, res, next) => {
  try {
    console.log('Error occured ', err);
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
