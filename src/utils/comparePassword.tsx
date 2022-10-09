var bcrypt = require("bcrypt");

module.exports.comparePassword = async function (password: any, hash: any) {
   try {
     return await bcrypt.compare(password, hash);
 
   } catch (error: any) {
     throw new Error(error);
   }
 };