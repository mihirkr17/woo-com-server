var jwt = require("jsonwebtoken");
const cryptoGraphy = require("crypto");

module.exports.generateItemID = () => (Math.floor(10000000 + Math.random() * 999999999999));


module.exports.generateTrackingID = () => ("tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString());


module.exports.generateOrderID = (id: string) => ("oi_" + cryptoGraphy.randomBytes(16).toString('hex').slice(0, 16) + id.slice(0, 4));


module.exports.generateListingID = () => ("lid" + cryptoGraphy.randomBytes(16).toString('hex').slice(0, 16));



/**
 * [This function will generate verify token]
 * @params empty;
 */
module.exports.generateVerifyToken = () => (cryptoGraphy.randomBytes(16).toString('hex'));


module.exports.generateUUID = () => {
   let str = cryptoGraphy.randomBytes(16).toString('hex');
   str = str && str.slice(0, 5) + Math.floor(10000 + Math.random() * 99999).toString();
   return str;
};


module.exports.generateExpireTime = () => {
   let expirationDate = new Date();
   return expirationDate.setMinutes(expirationDate.getMinutes() + 5);
}


/**
 * [Randomly generate six digit code]
 * @useCase for otp validation
 */
module.exports.generateSixDigitNumber = () => {
   let randomBytes = cryptoGraphy.randomBytes(4);
   let randomNumber = parseInt(randomBytes.toString('hex'), 16) % 900000 + 100000;
   return randomNumber.toString();
}


/**
 * [ Generate jwt token ]
 * @params [userInfo: Object]
 */
module.exports.generateJwtToken = (userInfo: any) => {
   const token = jwt.sign({
      _id: userInfo?._id,
      fullName: userInfo?.fullName,
      email: userInfo?.email,
      role: userInfo?.role,
      status: 'online'
   }, process.env.ACCESS_TOKEN, {
      algorithm: "HS256",
      expiresIn: "16h",
   });

   return token;
}


module.exports.generateUserDataToken = (user: any) => {
   user = user.toObject();
   user["password"] = undefined;

   const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
      algorithm: "HS256",
      expiresIn: "16h",
   });

   return token;
}


module.exports.generateSupplierDataToken = (supplier: any) => {
   const token = jwt.sign(supplier, process.env.ACCESS_TOKEN, {
      algorithm: "HS256",
      expiresIn: "16h",
   });

   return token;
}

module.exports.generateVerificationToken = (obj: any) => {

   const token = jwt.sign(obj, process.env.ACCESS_TOKEN, {
      algorithm: "HS256",
      expiresIn: "1h",
   });

   return token;
}