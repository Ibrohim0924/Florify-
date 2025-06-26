import { Schema, model } from "mongoose";

export const SoldProductSchema = new Schema({
    product_id: { type: String,ref: 'Product', required: true},
    client_id: { type: String, ref: 'Client' , required: true},
    quantity: {type: Number, required: true},
    total_price: { type: Number, required: true}
})

const SoldProduct = model('SoldProduct', SoldProductSchema)
export default SoldProduct