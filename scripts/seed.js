/**
 * Demo data for local development.
 *
 * Must only be required AFTER process.env.MONGO_URI is set, because the models
 * pull in utils/connectors/mongo.js which reads the env at require time.
 */
const bcrypt = require('bcrypt');

const seedIfEmpty = async () => {
  const Product = require('../models/product');
  const count = await Product.estimatedDocumentCount();
  if (count > 0) {
    console.log(`Seed skipped - database already has ${count} entities`);
    return;
  }
  await seed();
};

const seed = async () => {
  const { DB } = require('../utils/connectors/mongo');
  await DB.MONGOOSE_CONN_OBJECT.asPromise();

  const Product = require('../models/product');
  const Review = require('../models/review');
  const User = require('../models/user');
  const Category = require('../models/category');

  console.log('Seeding demo data...');

  await Promise.all([
    Product.deleteMany({}),
    Review.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
  ]);

  const categories = await Category.insertMany([
    { title: 'Clothing & Sarees', description: 'Boutiques, thrift stores and ethnic wear sellers' },
    { title: 'Jewellery', description: 'Silver, artificial and handmade jewellery sellers' },
    { title: 'Beauty & Skincare', description: 'Cosmetics, skincare and fragrance resellers' },
    { title: 'Sneakers & Streetwear', description: 'Sneaker resellers and streetwear drops' },
    { title: 'Home & Decor', description: 'Handmade decor, candles and furnishing' },
    { title: 'Food & Bakery', description: 'Home bakers and cloud kitchens' },
  ]);
  const cat = Object.fromEntries(categories.map((c) => [c.title, c._id]));

  const password = await bcrypt.hash('password123', 12);
  const users = await User.insertMany([
    { username: 'priya_m', email: 'priya@example.com', password, isVerified: true },
    { username: 'ankit.raj', email: 'ankit@example.com', password, isVerified: true },
    { username: 'sneha_k', email: 'sneha@example.com', password, isVerified: true },
    { username: 'rahul_dev', email: 'rahul@example.com', password, isVerified: true },
    { username: 'meera.s', email: 'meera@example.com', password, isVerified: true },
    { username: 'farhan_a', email: 'farhan@example.com', password, isVerified: true },
    { username: 'divya_n', email: 'divya@example.com', password, isVerified: true },
    { username: 'karthik.v', email: 'karthik@example.com', password, isVerified: true },
  ]);
  const u = Object.fromEntries(users.map((x) => [x.username, x._id]));

  //? A deliberate spread: sellers people would genuinely recommend, sellers with
  //? real complaints, and one outright scam - a review site that only shows
  //? 4-and-5-star pages is not doing its job.
  const entities = [
    {
      title: 'Kanchi Silk House',
      handle: 'kanchisilkhouse',
      platform: 'instagram',
      categoryId: cat['Clothing & Sarees'],
      description: 'Kanjivaram and soft silk sarees, ships pan-India. DM to order.',
      createdBy: u['priya_m'],
      reviews: [
        { by: 'priya_m', rating: 5, verified: true, comment: 'Ordered a wedding Kanjivaram, took 9 days to arrive but the quality is genuinely what was shown in the reel. Zari work is real. They shared a packing video before dispatch which made me feel much safer.' },
        { by: 'sneha_k', rating: 4, verified: true, comment: 'Saree is beautiful and colour matched the photos. Only issue was they took 3 days to reply to my DM after payment, which was stressful. Delivery itself was fine.' },
        { by: 'meera.s', rating: 5, verified: false, comment: 'Been buying from them for 2 years. Never had a problem. Prices are fair for the quality.' },
        { by: 'ankit.raj', rating: 4, verified: true, comment: 'Bought for my mother. Good fabric. Slightly overpriced compared to a Kanchipuram shop but the convenience is worth it.' },
      ],
    },
    {
      title: 'Glow Theory Skincare',
      handle: 'glowtheory.in',
      platform: 'instagram',
      categoryId: cat['Beauty & Skincare'],
      description: 'Imported Korean skincare, "100% authentic" claimed. Payment via UPI only.',
      createdBy: u['divya_n'],
      reviews: [
        { by: 'divya_n', rating: 1, verified: true, comment: 'Received a COSRX bottle with a batch code that does not exist on the official site. The seal was already broken. Asked for a refund and got blocked within an hour. I have the UPI receipt and the chat screenshots.' },
        { by: 'sneha_k', rating: 1, verified: true, comment: 'Same experience. The serum smelled completely different from the one I bought in Seoul. When I posted this in their comments it was deleted in 10 minutes.' },
        { by: 'farhan_a', rating: 2, verified: false, comment: 'Products arrived but packaging looked tampered with. Would not order again.' },
        { by: 'karthik.v', rating: 1, verified: true, comment: 'Paid 2400 rupees, never received anything. No response for 3 weeks now. Reported to cyber cell.' },
        { by: 'rahul_dev', rating: 5, verified: false, comment: 'Best seller ever!! Super fast delivery, everyone should buy from them!!! 100% genuine!!' },
      ],
    },
    {
      title: 'The Thrift Cart',
      handle: 'thethriftcart',
      platform: 'instagram',
      categoryId: cat['Clothing & Sarees'],
      description: 'Curated second-hand denim and vintage tees. Weekly drops at 8pm.',
      createdBy: u['ankit.raj'],
      reviews: [
        { by: 'ankit.raj', rating: 5, verified: true, comment: 'Genuinely well curated. Measurements in the caption were accurate to the cm, which almost never happens with thrift pages. Jeans fit exactly as listed.' },
        { by: 'farhan_a', rating: 4, verified: true, comment: 'Good stuff but the drops sell out in about 40 seconds which is frustrating. Item itself was clean and as described.' },
        { by: 'meera.s', rating: 3, verified: true, comment: 'The jacket had a small stain that was not visible in the photos. They did offer a partial refund when I showed them, so handled it fairly, but check carefully.' },
      ],
    },
    {
      title: 'Solework Sneakers',
      handle: 'soleworkco',
      platform: 'instagram',
      categoryId: cat['Sneakers & Streetwear'],
      description: 'Sneaker reseller - Jordans, Dunks, New Balance. Legit check on request.',
      createdBy: u['rahul_dev'],
      reviews: [
        { by: 'rahul_dev', rating: 5, verified: true, comment: 'Bought a pair of Dunk Lows. Sent them for a legit check at a third party before paying the balance and they passed. Seller was completely fine with me verifying first, which says a lot.' },
        { by: 'karthik.v', rating: 4, verified: true, comment: 'Real pair, fair price, slow shipping (11 days). Communication was good throughout though.' },
        { by: 'ankit.raj', rating: 2, verified: true, comment: 'My pair had a glue stain on the midsole that was not in the listing photos. They said "minor factory flaw, no returns". Shoes are real but be careful about condition.' },
      ],
    },
    {
      title: 'Roopa Silver Studio',
      handle: 'roopasilverstudio',
      platform: 'instagram',
      categoryId: cat['Jewellery'],
      description: '925 sterling silver, handmade in Jaipur. Hallmark certificate with every order.',
      createdBy: u['meera.s'],
      reviews: [
        { by: 'meera.s', rating: 5, verified: true, comment: 'Hallmark certificate was genuine, got it checked. Tarnish-free after 6 months of daily wear. This is the standard other silver pages should be held to.' },
        { by: 'divya_n', rating: 5, verified: true, comment: 'Ordered a custom nose pin, they made it exactly to the drawing I sent. Took 2 weeks as promised.' },
        { by: 'priya_m', rating: 4, verified: false, comment: 'Lovely pieces. Shipping to the northeast took longer than quoted but they kept me updated.' },
      ],
    },
    {
      title: 'Batter & Bloom',
      handle: 'batterandbloom',
      platform: 'instagram',
      categoryId: cat['Food & Bakery'],
      description: 'Home baker, Bengaluru. Custom cakes, 48hr notice.',
      createdBy: u['sneha_k'],
      reviews: [
        { by: 'sneha_k', rating: 5, verified: true, comment: 'Ordered a birthday cake with 2 days notice. Turned up on time, tasted exactly as good as it looked, and she sent progress photos while baking.' },
        { by: 'karthik.v', rating: 3, verified: true, comment: 'Cake was good but arrived 90 minutes late which was a problem for a party. Taste 5/5, reliability 2/5.' },
      ],
    },
    {
      title: 'Nomad Home Decor',
      handle: 'nomadhomedecor',
      platform: 'instagram',
      categoryId: cat['Home & Decor'],
      description: 'Handwoven rugs, macrame and terracotta. Ships in 5-7 days.',
      createdBy: u['farhan_a'],
      reviews: [
        { by: 'farhan_a', rating: 4, verified: true, comment: 'Rug quality is solid for the price. Colour was slightly warmer than the photos but not misleading.' },
        { by: 'priya_m', rating: 2, verified: true, comment: 'Macrame hanging arrived with knots already coming loose. They responded but only offered store credit, not a refund.' },
      ],
    },
    {
      title: 'Urban Fit Resell',
      handle: 'urbanfitresell',
      platform: 'instagram',
      categoryId: cat['Sneakers & Streetwear'],
      description: 'Branded surplus and export quality. "Original with tags".',
      createdBy: u['karthik.v'],
      reviews: [
        { by: 'karthik.v', rating: 1, verified: true, comment: 'Advertised as original export surplus. What arrived was an obvious replica with a misspelled brand tag. Refused refund and then deleted my comment from their post.' },
        { by: 'divya_n', rating: 1, verified: false, comment: 'Same here. They use stolen photos from other sellers. Reverse image search before you pay anyone.' },
        { by: 'sneha_k', rating: 2, verified: true, comment: 'Item did arrive but quality is nothing like "export". It is a normal local market piece at 4x the price.' },
      ],
    },
    {
      title: 'Clay & Co Pottery',
      handle: 'clayandco.pottery',
      platform: 'instagram',
      categoryId: cat['Home & Decor'],
      description: 'Wheel-thrown stoneware, made to order in Pondicherry.',
      createdBy: u['priya_m'],
      reviews: [
        { by: 'priya_m', rating: 5, verified: true, comment: 'Packaging was excellent, nothing broken despite being shipped across the country. Each piece genuinely handmade, small variations and all.' },
      ],
    },
    {
      title: 'Meher Ethnic Wear',
      handle: 'meherethnicwear',
      platform: 'whatsapp',
      categoryId: cat['Clothing & Sarees'],
      description: 'WhatsApp-only catalogue, suits and lehengas. Broadcast list seller.',
      createdBy: u['divya_n'],
      reviews: [
        { by: 'divya_n', rating: 3, verified: true, comment: 'Stitching quality was fine but the lehenga colour was noticeably different from the catalogue photo. They said "screen difference" which is partly fair.' },
        { by: 'meera.s', rating: 4, verified: true, comment: 'Good for the price. Ask for a real photo of the actual piece before paying, they will send it if you push.' },
      ],
    },
  ];

  let totalReviews = 0;

  for (const spec of entities) {
    const { reviews, ...entityData } = spec;

    const entity = await Product.create({
      ...entityData,
      entityType: 'social_seller',
      profileUrl:
        entityData.platform === 'instagram'
          ? `https://instagram.com/${entityData.handle}`
          : undefined,
      images: [],
      videos: [],
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });

    let totalRating = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const r of reviews) {
      //? spread createdAt so the feed doesn't look like one bulk import
      const daysAgo = Math.floor(Math.random() * 120) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await Review.create({
        comment: r.comment,
        rating: r.rating,
        productId: entity._id,
        userId: u[r.by],
        isVerifiedPurchase: r.verified,
        proofUrl: r.verified ? 'https://example.com/demo-receipt.jpg' : undefined,
        orderDate: r.verified ? createdAt : undefined,
        createdAt,
        updatedAt: createdAt,
      });

      totalRating += r.rating;
      distribution[r.rating] += 1;
      totalReviews += 1;
    }

    entity.totalRating = totalRating;
    entity.totalReviews = reviews.length;
    entity.averageRating = (totalRating / reviews.length).toFixed(2);
    entity.ratingDistribution = distribution;
    await entity.save();
  }

  console.log(`Seeded ${entities.length} entities, ${totalReviews} reviews, ${users.length} users, ${categories.length} categories`);
  console.log('Demo login: priya_m / password123');
};

module.exports = { seed, seedIfEmpty };

//? allow `node scripts/seed.js` against an already-configured MONGO_URI
if (require.main === module) {
  require('dotenv').config();
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. For local dev use `npm run dev:local`, which seeds automatically.');
    process.exit(1);
  }
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
