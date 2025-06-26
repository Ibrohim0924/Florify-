import { resError } from "../helper/resError.js";
import { resSuccess } from "../helper/resSuccess.js";
import Product from "../model/product.model.js";
import { isValidObjectId } from "mongoose";
import { createProductValidator, UpdateProductValidator } from "../validation/product.validation.js";

export class ProductController{
    async createProduct(req, res){
        try {
            const { value, error} = createProductValidator(req.body)
            if(error){
                return resError(res, error)
            }
            const product = await Product.create({
                ...value
            })
            return resSuccess(res, product)
        } catch (error) {
            return resError(res, error)
        }
    }

    async getAllProducts(_, res){
        try {
            const product = await Product.find().populate('sold_product')
            return resSuccess(res, product)
        } catch (error) {
            return resError(res, error)
        }
    }

    async getProductById(req, res){
        try {
            const product = await ProductController.findProductById(res, req.params.id)
            return resSuccess(res, product)
        } catch (error) {
            return resError(res, error)
        }
    }

    async updateProductById(req, res){
        try {
            const id = req.params.id
            const product = await ProductController.findProductById(res, id)
            const { value, error } = UpdateProductValidator(req.body)
            if(error){
                return resError(res, error)
            }
            const updatedproduct = await Product.findByIdAndUpdate(id, {
                ...value
            }, { new: true})
            return resSuccess(res, updatedproduct)
        } catch (error) {
            return resError(res, error)
        }
    }

    async deleteProductById(req, res){
            try {
                const id = req.params.id
                await ProductController.findProductById(res, id)
                await Product.findByIdAndDelete(id)
                return resSuccess(res, {
                    message: 'Product deleted successfully'
                })
            } catch (error) {
                return resError(res, error)
            }
    }
    

    static async findProductById(res, id){
        try {
            if(!isValidObjectId(id)){
                return resError(res, 'Invalid Object ID', 400)
            }
            const product = await Product.findById(id).populate('sold_product')
            if(!product){
                return resError(res, 'Product not found', 404)
            }
            return product
        } catch (error) {
            return resError(res, error)
        }
    }
}
