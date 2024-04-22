const { Router } = require('express');
const { getAllProducts, getSingleProduct, addProduct, deleteProduct, editProduct, createCategory, listCategories } = require('./controllers');
const { isAuthenticated } = require('../../utils/helpers/helper');
const router = Router();

//? get products
router.get('/product', getAllProducts);

//? get single product
router.get('/product/:id', getSingleProduct);

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

module.exports = router;
