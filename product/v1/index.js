const { Router } = require('express');
const { getAllProducts, getSingleProduct, addProduct, deleteProduct, editProduct, createCategory, listCategories, uploadFile, getTrendingProducts, searchProducts } = require('./controllers');
const { isAuthenticated } = require('../../utils/helpers/helper');
const multer = require('multer');
const { ALLOWED_MIME_TYPES } = require('../../utils/constants/constant');
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else cb(new Error('Invalid file type'));
  },
});
const router = Router();

//? get products
router.get('/product', getAllProducts);

//? get single product
router.get('/product/:id', getSingleProduct);

//? get trending products
router.get('/trending-products', getTrendingProducts);

//? add product
router.post('/product', isAuthenticated, addProduct);

//? delete product
router.delete('/product/:id', isAuthenticated, deleteProduct);

//? edit product
router.put('/product/:id', isAuthenticated, editProduct);

// todo - upvote / downvote a product

/*************** Category Routes **************/
//? create category
router.post('/category', isAuthenticated, createCategory);

//? list categories
router.get('/category', listCategories);

//? file upload APi
router.post('/uploadFile', isAuthenticated, upload.array('file', 10), uploadFile);

// Add this route for searching products
router.get('/search', searchProducts);

module.exports = router;
