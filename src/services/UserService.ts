const Customer = require("../model/customer.model");
const UserTbl = require("../model/user.model");
const db = require("mongodb");
module.exports = class UserService {
  /**
   * [findUserByEmail description]
   *
   * @param   {string}  email  [email description]
   *
   * @return  {[type]}         [return description]
   */
  async findUserByEmail(email: string) {
    try {
      return await UserTbl.findOne(
        { $and: [{ email: email }, { accountStatus: "Active" }] },
        {
          password: 0,
          createdAt: 0,
          phonePrefixCode: 0,
          becomeSellerAt: 0,
        }
      );
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * [async description]
   *
   * @param   {string<number>}   email  [email description]
   *
   * @return  {Promise<number>}         [return description]
   */
  async countUserByEmail(email: string): Promise<number | Error> {
    try {
      return await UserTbl.countDocuments({ email });
    } catch (error) {
      throw error;
    }
  }
};
