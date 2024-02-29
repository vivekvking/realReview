const express = require('express');
const app = express();
require('dotenv').config();

app.use('/', (req, res) => {
  res.send('Heyyy Server Started');
});

app.listen(process.env.PORT, () => {
  console.log('Server started on port ', process.env.PORT);
});
