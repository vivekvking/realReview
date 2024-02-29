const Product = require("../../models/product");
const { sendResponse } = require("../../utils/helpers/helper");

const getAllProducts = async (req, res, next) => {
	try {
    // todo - add a searching algorithm in this
		const { skip = 0, limit = 20 } = req.query;
		const products = await Product.find({}).skip().limit().exec();
		return sendResponse(res, 200, products, "success!");
	} catch (err) {
    err.scope = "getAllProducts"
    next(err)
	}
};

const getSingleProduct = async(req, res, next) => {
  try{
    let { id } = req.params;
    let status = 200, message = "success!";
    const product = await Product.findOne({ _id: id});
    if(!product){
      status = 404;
      message = "Not Found!"
    }
    return sendResponse(res, status, product, message);
  }catch(err){
    err.scope = "getSingleProduct"
    next(err)
  }
}

module.exports = { 
  getAllProducts,
  getSingleProduct,
};
