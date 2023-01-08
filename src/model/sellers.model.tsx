import { Schema, model } from "mongoose";

const address1 = new Schema({
   country: { type: String, required: true },
   division: { type: String, required: true },
   city: { type: String, required: true },
   district: { type: String, required: true },
   thana: { type: String, required: true },
});

const address2 = new Schema({
   country: { type: String, default: "" },
   division: { type: String, default: "" },
   city: { type: String, default: "" },
   district: { type: String, default: "" },
   thana: { type: String, default: "" },
});

const storeType = new Schema({
   shopName: {type: String, required: true},
   shopNumber: {type: String, required: true}
});

interface ISeller {
   fullName: String;
   email: String;
   password: String;
   store: any;
   phoneNumber: String;
   phoneNumberAlt: String;
   address1: any;
   address2: any;
}

const sellerSchema = new Schema<ISeller>({
   fullName: { type: String, required: true },
   email: { type: String, required: true },
   password: { type: String, required: true },
   store: {type: storeType},
   phoneNumber: { type: String, required: true },
   phoneNumberAlt: { type: String, required: true },
   address1: { type: address1, required: true },
   address2: { type: address2 }
});


var Seller = model<ISeller>("Seller", sellerSchema, 'sellers');
module.exports = Seller;