module.exports = {
  SALT_ROUNDS : +process.env.SALT_ROUNDS,
  SALT_ENV : process.env.SALT_CONSTANT,
  JWT_ACCESS_HASH_KEY : process.env.JWT_ACCESS_HASH_KEY,
  JWT_REFRESH_HASH_KEY : process.env.JWT_REFRESH_HASH_KEY,
}
