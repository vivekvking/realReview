const OpenAi = require('openai');
const { OPEN_AI_API_KEY } = require('./constants/envConstants');
const Product = require('../models/product');
const Review = require('../models/review');
const { handleAppError } = require('./helpers/error');
const openai = new OpenAi({
  apiKey: OPEN_AI_API_KEY,
});

const generateAIReview = async (productId) => {
  try {
    let promptText = 'Generate a concise summary for the following product reviews and replies. The summary should highlight common praises, criticisms, and the overall sentiment of the reviews.\n\n';
    const product = await Product.findOne({ _id: productId });
    if (!product) return;
    promptText += `Product: ${product.title}\nDescription: ${product.description}\n\n`;
    let reviews = await Review.aggregate([
      {
        $match: {
          productId: product._id,
        },
      },
      {
        $group: {
          _id: '$parentId',
          data: {
            $push: { comment: '$comment', id: '$_id' },
          },
        },
      },
    ]);
    if (!reviews || reviews.length <= 0) {
      return;
    }
    console.log('Generating AI Review for product ------> ', product._id);
    promptText += `Reviews & Replies:\n`;
    let count = 1;
    let baseLevelReviews = reviews.filter((e) => !e._id)?.[0]?.['data'];
    for (let baseReveiw of baseLevelReviews) {
      let id = baseReveiw.id;
      let review = baseReveiw.comment;
      promptText += `${count}. Review : "${review}"\n`;
      let replies = reviews.filter((e) => e._id?.toLocaleString() == id?.toLocaleString())?.[0]?.['data'];
      if (!replies || replies.length == 0) continue;
      for (let reply of replies) {
        promptText += `Reply: "${reply.comment}"\n`;
      }
    }
    promptText += `\nPlease provide a summary that includes:\n- Common positive points about the product.\n- Common negative points about the product.\n- Overall sentiment of the reviews.`;

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: promptText }],
    });
    console.log('result from openAI', JSON.stringify(chatCompletion, null, 2));
    product.aiGeneratedReview = chatCompletion?.choices?.[0]?.message?.content ?? '';
    await product.save();
  } catch (err) {
    err.scope = err.scope || 'generateAIReview';
    handleAppError({ err });
  }
};

module.exports = {
  generateAIReview,
};
