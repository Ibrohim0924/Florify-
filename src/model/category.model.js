import { Schema, model } from "mongoose";

export const CategorySchema = new Schema({
    name: {type: String, required: true},
    description: { type: String}
}, {
    timestamps: true,
    toJSON: {virtuals : true},
    toObject: {virtuals: true}
})

CategorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category_id'
})


const Category = model('Category', CategorySchema)
export default Category