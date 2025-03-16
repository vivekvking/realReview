# Database Migration Scripts

This directory contains scripts for database migrations and updates.

## Rating Distribution Update Script

The `updateRatingDistribution.js` script updates all existing products with rating distribution data. This is necessary after deploying the new version that includes the rating distribution feature.

### What it does

1. Connects to the MongoDB database
2. Finds all products in the database
3. For each product, it:
   - Initializes a rating distribution object with counts for each star rating (1-5)
   - Finds all reviews for the product
   - Counts the number of reviews for each star rating
   - Updates the product with the calculated rating distribution

### How to run

```bash
# Navigate to the backend directory
cd backend

# Run the script
node scripts/updateRatingDistribution.js
```

### When to run

This script should be run once after deploying the new version with rating distribution support. It does not need to be run again as the application will maintain the rating distribution data automatically for new reviews. 