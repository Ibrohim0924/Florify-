import { Schema, model } from "mongoose";

const SalesmanSchema = new Schema({
    username: { type: String, required: true, unique: true},
    fullName: { type: String, required: true},
    phoneNumber: { type: String, required: true, unique: true},
    adress: {type: String},
    email: { type: String, required: true, unique: true},
    hashedPassword: { type: String, required: true}
}, {
    timestamps: true,
    toJSON: {virtuals : true},
    toObject: {virtuals: true}
})

SalesmanSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'salesman_id'
})

const Salesman = model('Salesman', SalesmanSchema)
export default Salesman 