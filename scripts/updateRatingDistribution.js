/**
 * Script to update all existing products with rating distribution data
 * 
 * This script should be run once after deploying the new version with rating distribution
 * It will calculate the rating distribution for all products based on their reviews
 * 
 * Usage: node scripts/updateRatingDistribution.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB URI from .env
const MONGO_URI = 'mongodb+srv://admin:vxnAxzWj7qKktzXJ@realreview.pm0nxqa.mongodb.net/';

// Define schemas
const ProductSchema = new mongoose.Schema({
  title: String,
  description: String,
  images: Array,
  videos: Array,
  createdBy: mongoose.Types.ObjectId,
  category: mongoose.Types.ObjectId,
  categoryId: mongoose.Types.ObjectId,
  isDeleted: Boolean,
  totalRating: Object,
  averageRating: Number,
  totalReviews: Number,
  totalReplies: Number,
  aiGeneratedReview: String,
  ratingDistribution: Object
});

const ReviewSchema = new mongoose.Schema({
  comment: String,
  rating: Number,
  productId: mongoose.Types.ObjectId,
  parentId: mongoose.Types.ObjectId,
  reviewId: mongoose.Types.ObjectId,
  images: Array,
  videos: Array,
  replyCount: Number,
  userId: mongoose.Types.ObjectId
});

async function updateRatingDistribution() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Product = mongoose.model('product', ProductSchema, 'product');
    const Review = mongoose.model('review', ReviewSchema, 'review');
    
    console.log('Fetching all products...');
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      console.log(`Processing product: ${product.title} (${product._id})`);
      
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
      
      console.log(`Found ${reviews.length} reviews for product ${product._id}`);
      
      // Count ratings
      for (const review of reviews) {
        if (review.rating) {
          const ratingKey = Math.floor(review.rating);
          if (ratingKey >= 1 && ratingKey <= 5) {
            ratingDistribution[ratingKey]++;
          }
        }
      }
      
      console.log(`Rating distribution for product ${product._id}:`, ratingDistribution);
      
      // Update product
      product.ratingDistribution = ratingDistribution;
      await product.save();
      console.log(`Updated product ${product._id} with rating distribution`);
      
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} products so far...`);
      }
    }
    
    console.log(`Successfully updated rating distribution for ${updatedCount} products`);
  } catch (error) {
    console.error('Error updating rating distribution:', error);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the update function
console.log('Starting update function');
updateRatingDistribution(); 