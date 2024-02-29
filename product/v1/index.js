const { Router } = require("express");
const { getAllProducts, getSingleProduct } = require("./controllers");
const router = Router();

//? get products
router.get("/product", getAllProducts);

//? get single product
router.get("/product/:id", getSingleProduct);

//? add product

//? delete product

//? edit product

module.exports = router;
