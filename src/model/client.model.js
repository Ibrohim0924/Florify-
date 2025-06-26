import { Schema, model } from "mongoose";

export const ClientSchema = new Schema({
    name: { type: String, required: true},
    phoneNumber: { type: String, required: true, unique: true},
    adress: {type: String},
    hashedPassword: { type: String, required: true}
}, {
    timestamps: true,
    toJSON: { virtuals: true},
    toObject: { virtuals: true}
})

ClientSchema.virtual('sold_product', {
    ref: 'SoldProduct',
    localField: '_id',
    foreignField: 'client_id'
})

const Client = model('Client', ClientSchema)
export default Client