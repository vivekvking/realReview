/**
 * Simple script to update rating distribution
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB URI from .env
const MONGO_URI = 'mongodb+srv://admin:vxnAxzWj7qKktzXJ@realreview.pm0nxqa.mongodb.net/';

// Define schemas
const ProductSchema = new mongoose.Schema({
  title: String,
  ratingDistribution: Object
});

const ReviewSchema = new mongoose.Schema({
  productId: mongoose.Types.ObjectId,
  rating: Number,
  parentId: mongoose.Types.ObjectId
});

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Product = mongoose.model('product', ProductSchema, 'product');
    const Review = mongoose.model('review', ReviewSchema, 'review');
    
    console.log('Fetching products...');
    const products = await Product.find({}).limit(5);
    console.log(`Found ${products.length} products`);
    
    for (const product of products) {
      console.log(`Processing product: ${product.title}`);
      
      // Initialize rating distribution
      const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };
      
      // Get reviews
      const reviews = await Review.find({
        productId: product._id,
        parentId: { $exists: false },
        rating: { $exists: true }
      });
      
      console.log(`Found ${reviews.length} reviews`);
      
      // Count ratings
      for (const review of reviews) {
        if (review.rating) {
          const ratingKey = Math.floor(review.rating);
          if (ratingKey >= 1 && ratingKey <= 5) {
            ratingDistribution[ratingKey]++;
          }
        }
      }
      
      console.log('Rating distribution:', ratingDistribution);
      
      // Update product
      product.ratingDistribution = ratingDistribution;
      await product.save();
      console.log('Product updated');
    }
    
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

run(); 