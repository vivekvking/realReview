const { Router } = require('express');
const { getReviewOfSingleProduct, getCommentsOnReview } = require('./controllers');
const router = Router();

//? get reviews of a single product
router.get('/:productId', getReviewOfSingleProduct);

//? get comments on a review
router.get('/:productId/:reviewId', getCommentsOnReview);

//? add review for a product or add comment for a review

//? delete a review / comment

// todo - like a review or a comment

module.exports = router;
