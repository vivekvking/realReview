const User = require('../../models/user');
const { httpError } = require('../../utils/helpers/error');
const { sendResponse } = require('../../utils/helpers/helper');

const createUser = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) throw new httpError(null, 400, {}, 'Insufficient Data');

    // validate duplicate user
    // todo - verify user

    const user = await User.create({ username, password, email });
    return sendResponse(res, 200, user, 'success!')
  } catch (err) {
    err.scope = err.scope || 'createUser';
    next(err);
  }
};

module.exports = {
  createUser
}
