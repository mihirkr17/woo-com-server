import { Schema, model } from "mongoose";


const order_schema = new Schema({
   customer: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      shipping_address: Object
   },

})