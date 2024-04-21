const User = require("../../models/user");

const validateUniqueUser = async (username, email) => {
  try{
    let ue = await User.findOne({email}).lean().exec();
    if(ue) return false;
    let uu = await User.findOne({username}).lean().exec()
    if(uu) return false;
    return true;
  }catch(err){
    err.scope = err.scope || 'validateUniqueUser';
    throw err
  }
}

module.exports = {
  validateUniqueUser
}