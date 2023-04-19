const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const cryPto = require("crypto");


module.exports.generateItemID = () => (Math.floor(10000000 + Math.random() * 999999999999));

module.exports.generateTrackingID = () => ("tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString());

module.exports.generateOrderID = () => ("oi_" + cryPto.randomBytes(16).toString('hex'));


module.exports.transferMoneyToSeller = async (intentID: string, sellerStripeID: string) => {
   try {
      const transfer = await stripe.transfer.create(intentID, {
         amount: 900, // amount in cents
         currency: 'usd',
         destination: sellerStripeID
      });
   } catch (error: any) {

   }
} 