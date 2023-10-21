const User = require("../model/user.model");

/**
 * [async description]
 *
 * @param   {string<number>}   email  [email description]
 *
 * @return  {Promise<number>}         [return description]
 */
async function countUserByEmail(email: string): Promise<number | Error> {
  try {
    return await User.countDocuments({ email });
  } catch (error) {
    throw error;
  }
}

/**
 * [async description]
 *
 * @param   {string<any>}   email  [email description]
 *
 * @return  {Promise<any>}         [return description]
 */
async function findUserByEmail(email: string): Promise<any> {
  try {
    return await User.findOne({ email }, { createdAt: 0, __v: 0 });
  } catch (error) {
    throw error;
  }
}

module.exports = { countUserByEmail, findUserByEmail };
