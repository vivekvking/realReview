const { Router } = require('express');
const { getAllProducts, getSingleProduct, addProduct, deleteProduct, editProduct } = require('./controllers');
const router = Router();

//? get products
router.get('/product', getAllProducts);

//? get single product
router.get('/product/:id', getSingleProduct);

//? add product
router.post('/product', addProduct);

//? delete product
router.delete('/product/:id', deleteProduct);

//? edit product
router.put('/product/:id', editProduct);

// todo - upvote / downvote a product

module.exports = router;
