/**
 * Simple script to test MongoDB connection
 */

console.log('Test script started');

// Import the DB connection
const { DB } = require('../utils/connectors/mongo');
console.log('DB module imported');
console.log('DB connection object available:', !!DB.MONGOOSE_CONN_OBJECT);

// Import a model
const Product = require('../models/product');
console.log('Product model imported');

// Try a simple query
async function testQuery() {
  try {
    console.log('Executing test query...');
    const count = await Product.countDocuments();
    console.log(`Database contains ${count} products`);
    process.exit(0);
  } catch (error) {
    console.error('Error executing query:', error);
    process.exit(1);
  }
}

// Run the test
testQuery(); 