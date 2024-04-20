const express = require('express');
const app = express();
require('dotenv').config();
app.use(express.json())
const reviewRoutes = require('./review')
const productRoutes = require('./product')
const userRoutes = require('./user') 

app.use('/review', reviewRoutes)
app.use('/product', productRoutes)
app.use('/user', userRoutes)

app.use('/', (req, res) => {
  res.send('Heyyy Server Started');
});

app.listen(process.env.PORT, () => {
  console.log('Server started on port ', process.env.PORT);
});
