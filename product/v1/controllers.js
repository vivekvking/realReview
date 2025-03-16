const Product = require('../../models/product');
const { sendResponse } = require('../../utils/helpers/helper');
const { httpError } = require('../../utils/helpers/error');
const Category = require('../../models/category');
const User = require('../../models/user');
const { PUBLIC_BUCKET_NAME } = require('../../utils/constants/envConstants');
const { uploadFileToGCP } = require('../../utils/helpers/gcphelper');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const getAllProducts = async (req, res, next) => {
  try {
    // todo - add a searching algorithm in this
    const { skip = 0, limit = 20, search } = req.query;
    let query = {};
    if (search) query['title'] = { $regex: search, $options: 'i' };
    
    // Update to populate the category information
    const products = await Product.find(query)
      .populate('categoryId', 'title description')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
      
    // Ensure category is properly set for each product
    products.forEach(product => {
      if (product.categoryId && !product.category) {
        product.category = product.categoryId;
      }
    });
    
    return sendResponse(res, 200, products, 'success!');
  } catch (err) {
    err.scope = 'getAllProducts';
    next(err);
  }
};

const getSingleProduct = async (req, res, next) => {
  try {
    let { id } = req.params;
    if (!id) throw new httpError(null, 400, {}, 'Insufficient Data');
    
    // Update to populate the category information
    const product = await Product.findOne({ _id: id })
      .populate('categoryId', 'title description')
      .lean();
      
    if (!product) throw new httpError(null, 404, {}, 'Product not found', { id });
    
    // Ensure category is properly set
    if (product.categoryId && !product.category) {
      product.category = product.categoryId;
    }
    
    return sendResponse(res, 200, product, 'success!');
  } catch (err) {
    err.scope = 'getSingleProduct';
    next(err);
  }
};

const addProduct = async (req, res, next) => {
  try {
    let { title, description, images, videos, categoryId, username, userId } = req?.body;
    if (!title) throw new httpError(null, 400, {}, 'Insufficient Data');
    if ((images && !Array.isArray(images)) || (videos && !Array.isArray(videos))) {
      throw new httpError(null, 400, {}, 'Bad Request');
    }
    let product = await Product.create({
      title,
      description,
      images,
      videos,
      createdBy: userId,
      categoryId,
    });
    sendResponse(res, 200, product, 'success!');
  } catch (err) {
    err.scope = err.scope || 'addProduct';
    next(err);
  }
};

const editProduct = async (req, res, next) => {
  try {
    let { title, description, images, videos, categoryId } = req?.body;
    let { id } = req?.params;
    if (!id || !title) throw new httpError(null, 400, {}, 'Insufficient Data');
    if ((images && !Array.isArray(images)) || (videos && !Array.isArray(videos))) {
      throw new httpError(null, 400, {}, 'Bad Request');
    }

    // todo - add checks as to who all can edit this

    let product = await Product.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          title,
          description,
          images,
          videos,
          categoryId,
        },
      },
      {
        new: true,
      },
    );
    return sendResponse(res, 200, product, 'success!');
  } catch (err) {
    err.scope = err.scope || 'editProduct';
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    let { id } = req.params;
    if (!id) throw new httpError(null, 400, {}, 'Insufficient Data');
    const product = await Product.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          isDeleted: true,
        },
      },
      { new: true },
    );
    if (!product) throw new httpError(null, 404, {}, 'Product not found', { id });
    return sendResponse(res, 200, {}, 'Product deleted successfully!');
  } catch (err) {
    err.scope = err.scope || 'deleteProduct';
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    // todo - don't allow normal users to create category or if it is created then it has to be verified by admin
    let { title, description } = req.body;
    if (!title) throw new httpError(null, 400, {}, 'Insufficient Data');

    // todo - check if the category already exists

    const category = await Category.create({ title, description });
    return sendResponse(res, 200, category, 'success!');
  } catch (err) {
    err.scope = err.scope || 'createCategory';
    next(err);
  }
};

const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().lean().exec();
    return sendResponse(res, 200, categories, 'success!');
  } catch (err) {
    err.scope = err.scope || 'listCategories';
    next(err);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.files || req.files.length == 0) throw new httpError(null, 400, {}, 'Insufficient Data');
    let promises = [];
    for (let file of req.files) {
      let bufferData = file?.buffer;
      let date = moment().format('YYYY-MM-DD');
      let destination = `products/${date}/${uuidv4()}_${file?.originalname.replaceAll(' ', '_')}`;
      let mimetype = file?.mimetype;
      const bucketName = PUBLIC_BUCKET_NAME;

      let public_url = uploadFileToGCP(bucketName, destination, bufferData, mimetype);
      promises.push(public_url);
    }
    let public_urls = await Promise.all(promises);
    return sendResponse(res, 200, { url: public_urls }, 'success!');
  } catch (err) {
    err.scope = 'uploadFile';
    next(err);
  }
};

/**
 * Get trending products based on a recommendation algorithm
 * Factors considered:
 * 1. Recent activity (reviews, replies)
 * 2. Average rating
 * 3. Total reviews count
 * 4. Product age (newer products get a boost)
 */
const getTrendingProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get current date for age calculation
    const currentDate = new Date();
    
    // Fetch products with their reviews and populate category information
    const products = await Product.find({ isDeleted: { $ne: true } })
      .populate('categoryId', 'title description')
      .sort({ createdAt: -1 })
      .limit(100) // Get a larger pool of recent products to calculate scores
      .lean();
    
    // Ensure category is properly set for each product
    products.forEach(product => {
      if (product.categoryId && !product.category) {
        product.category = product.categoryId;
      }
    });
    
    // Calculate a trending score for each product
    const productsWithScores = products.map(product => {
      // Base score starts at 0
      let score = 0;
      
      // Factor 1: Product age (newer products get higher score)
      // Products less than 30 days old get a boost
      const productAge = Math.max(1, Math.floor((currentDate - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)));
      const ageScore = Math.max(0, 30 - productAge) * 2; // Max 60 points for brand new products
      
      // Factor 2: Review count
      const reviewScore = (product.totalReviews || 0) * 10; // 10 points per review
      
      // Factor 3: Rating score (0-5 scale converted to 0-50)
      const ratingScore = (product.averageRating || 0) * 10; // Max 50 points for 5-star products
      
      // Factor 4: Recent activity (replies)
      const replyScore = (product.totalReplies || 0) * 5; // 5 points per reply
      
      // Calculate final score
      score = ageScore + reviewScore + ratingScore + replyScore;
      
      return {
        ...product,
        trendingScore: score
      };
    });
    
    // Sort by trending score and take the top N
    const trendingProducts = productsWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
    
    return sendResponse(res, 200, trendingProducts, 'success!');
  } catch (err) {
    err.scope = 'getTrendingProducts';
    next(err);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return sendResponse(res, 200, [], 'success!');
    }
    
    // Split the query into keywords for more flexible matching
    const keywords = q.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    
    // Create an array of regex patterns for each keyword
    const keywordPatterns = keywords.map(keyword => new RegExp(keyword, 'i'));
    
    // Build a more sophisticated query
    const searchQuery = {
      isDeleted: { $ne: true },
      $or: [
        // Match title containing any of the keywords
        { title: { $regex: keywordPatterns.map(p => p.source).join('|'), $options: 'i' } },
        // Match description containing any of the keywords
        { description: { $regex: keywordPatterns.map(p => p.source).join('|'), $options: 'i' } },
        // Match exact title (for higher relevance)
        { title: { $regex: new RegExp(q, 'i') } }
      ]
    };
    
    // Find products matching our query
    let products = await Product.find(searchQuery)
      .populate('categoryId')
      .populate('createdBy', 'username')
      .lean();
    
    // Search for categories matching keywords
    const categoryIds = await Category.find({ 
      name: { $regex: keywordPatterns.map(p => p.source).join('|'), $options: 'i' } 
    }).distinct('_id');
    
    if (categoryIds.length > 0) {
      const productsByCategory = await Product.find({
        categoryId: { $in: categoryIds },
        isDeleted: { $ne: true },
        // Exclude products already found
        _id: { $nin: products.map(p => p._id) }
      })
      .populate('categoryId')
      .populate('createdBy', 'username')
      .lean();
      
      // Add category-matched products
      products = [...products, ...productsByCategory];
    }
    
    // Calculate relevance score for each product
    const scoredProducts = products.map(product => {
      let score = 0;
      const title = product.title?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      const categoryName = product.categoryId?.name?.toLowerCase() || '';
      
      // Exact match in title gets highest score
      if (title === q.toLowerCase()) {
        score += 100;
      }
      
      // Title contains full query
      if (title.includes(q.toLowerCase())) {
        score += 50;
      }
      
      // Count how many keywords match in the title
      keywords.forEach(keyword => {
        if (title.includes(keyword)) {
          score += 10;
        }
      });
      
      // Count how many keywords match in the description
      keywords.forEach(keyword => {
        if (description.includes(keyword)) {
          score += 5;
        }
      });
      
      // Category name matches
      if (categoryName.includes(q.toLowerCase())) {
        score += 30;
      }
      
      // Keywords in category name
      keywords.forEach(keyword => {
        if (categoryName.includes(keyword)) {
          score += 8;
        }
      });
      
      // Boost score for products with reviews
      if (product.totalReviews > 0) {
        score += Math.min(20, product.totalReviews * 2);
      }
      
      // Boost score for newer products
      const productAge = Math.floor((new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24));
      if (productAge < 30) {
        score += Math.max(0, 10 - Math.floor(productAge / 3));
      }
      
      return {
        ...product,
        relevanceScore: score
      };
    });
    
    // Sort by relevance score and return
    const sortedProducts = scoredProducts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(product => {
        // Remove the score before sending to client
        const { relevanceScore, ...productWithoutScore } = product;
        return productWithoutScore;
      });
    
    return sendResponse(res, 200, sortedProducts, 'success!');
  } catch (err) {
    err.scope = err.scope || 'searchProducts';
    next(err);
  }
};

module.exports = {
  getAllProducts,
  getSingleProduct,
  addProduct,
  deleteProduct,
  editProduct,
  createCategory,
  listCategories,
  uploadFile,
  getTrendingProducts,
  searchProducts
};
