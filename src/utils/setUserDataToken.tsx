var jwt = require("jsonwebtoken");

module.exports = function setUserDataToken(user: any) {

   
   const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
      algorithm: "HS256",
      expiresIn: "16h",
   });

   return token;
}