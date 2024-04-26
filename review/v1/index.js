const { Router } = require('express');
const { getReviewOfSingleProduct, getCommentsOnReview, addReview, deleteReview, editReview } = require('./controllers');
const { isAuthenticated } = require('../../utils/helpers/helper');
const router = Router();

//? get reviews of a single product
router.get('/:productId', getReviewOfSingleProduct);

//? get comments on a review
router.get('/:productId/:reviewId', getCommentsOnReview);

//? add review for a product or add comment for a review
router.post('/', isAuthenticated, addReview);

//? edit a review / comment
router.put('/', isAuthenticated, editReview);

//? delete a review / comment
router.delete('/', isAuthenticated, deleteReview);

// todo - like a review or a comment

module.exports = router;
