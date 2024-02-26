import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use("/", (req, res) => {
  res.send("Heyyy Server Started Hello")
});

app.listen(process.env.PORT, ()=> {
  console.log("Server started on port ", process.env.PORT);
})