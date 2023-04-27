var bcrypt = require("bcrypt");

module.exports.comparePassword = async (password: any, hash: any) => {
   try {
      return await bcrypt.compare(password, hash);
   } catch (error: any) {
      return error;
   }
};