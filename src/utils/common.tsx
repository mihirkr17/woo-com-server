const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const cryPto = require("crypto");


module.exports.generateItemID = () => (Math.floor(10000000 + Math.random() * 999999999999));

module.exports.generateTrackingID = () => ("tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString());

module.exports.generateOrderID = (id: string) => ("oi_" + cryPto.randomBytes(16).toString('hex').slice(0, 16) + id.slice(0, 4));

module.exports.generateVerifyToken = () => (cryPto.randomBytes(16).toString('hex'));


module.exports.generateUUID = () => {
   let str = cryPto.randomBytes(16).toString('hex');
   str = str && str.slice(0, 5) + Math.floor(10000 + Math.random() * 99999).toString();
   return str;
};

module.exports.generateExpireTime = () => {
   let expirationDate = new Date();
   return expirationDate.setMinutes(expirationDate.getMinutes() + 5);
}

module.exports.generateSixDigitNumber = () => {
   let randomBytes = cryptos.randomBytes(4);
   let randomNumber = parseInt(randomBytes.toString('hex'), 16) % 900000 + 100000;
   return randomNumber.toString();
}