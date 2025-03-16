const { Router } = require('express');
const { getReviewOfSingleProduct, getCommentsOnReview, addReview, deleteReview, editReview, getRatingDistribution } = require('./controllers');
const { isAuthenticated } = require('../../utils/helpers/helper');
const router = Router();

//? get reviews of a single product
router.get('/:productId', getReviewOfSingleProduct);

//? get rating distribution for a product
router.get('/:productId/distribution', getRatingDistribution);

//? get comments on a review
router.get('/:productId/:reviewId', getCommentsOnReview);

//? add review or comment
router.post('/', isAuthenticated, addReview);

//? edit review or comment
router.put('/', isAuthenticated, editReview);

//? delete review or comment
router.delete('/', isAuthenticated, deleteReview);

// todo - like a review or a comment

module.exports = router;
