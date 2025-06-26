import { resError } from "../helper/resError.js";
import { resSuccess } from "../helper/resSuccess.js";
import SoldProduct from "../model/sold_product.model.js";
import { isValidObjectId } from "mongoose";
import { createSoldProductValidator, updateSoldProductValidator } from "../validation/sold_product.validation.js";
import Product from "../model/product.model.js";
import Client from "../model/client.model.js";

export class SoldProductController{
    async createSoldProduct(req, res){
        try {
            const {value,error}= createSoldProductValidator(req.body)
            if(error){
                return resError(res,error,404)
            }
            const {product_id,client_id,quantity}=value
            const product= await Product.findById(product_id)
            if(!product){
                return resError(res,'Product not found',404)
            }
            const client = await Client.findById(client_id)
            if(!client){
                return resError(res,'Client not found',404)
            }
            const total_price=quantity*product.price

            const soldproduct = await SoldProduct.create({
                product_id,
                client_id,
                quantity,
                total_price
            })
            return resSuccess(res,soldproduct,201)

        } catch (error) {
            return resError(res, error)
        }
    }

    async getAllSoldProducts(req, res){
        try {
            const sold_product = await SoldProduct.find()
            return resSuccess(res, sold_product)
        } catch (error) {
            return resError(res, error)
        }
    }

    async getSoldProductById(req, res){
        try {
            const sold_product = await SoldProductController.findSoldProductById(res, req.params.id)
            return resSuccess(res, sold_product)
        } catch (error) {
            return resError(res, error)
        }
    }

    async updateSoldProductById(req, res){
        try {
            const id = req.params.id
            await SoldProductController.findSoldProductById(res, id)
            const { value, error } = updateSoldProductValidator(req.body)
            if(error){
                return resError(res, error  )
            }
            const updateSoldProduct = await SoldProduct.findByIdAndUpdate(id, 
                value
            , { new: true })
            return resSuccess(res, updateSoldProduct)
        } catch (error) {
            return resError(res, error)
        }
    }

    async deleteSoldProductById(req, res){
        try {
            const id = req.params.id
            await SoldProductController.findSoldProductById(res, id)
            await SoldProduct.findByIdAndDelete(id)
            return resSuccess(res, {
                message: 'Sold Product deleted successfully'
            })
        } catch (error) {
            return resError(res, error)
        }
    }

    static async findSoldProductById(res, id){
        try {
            if(!isValidObjectId(id)){
                return resError(res, 'Invalid Object ID', 400)
            }
            const sold_product = await SoldProduct.findById(id)
            if(!sold_product){
                return resError(res, 'Sold Product not found')
            }
            return sold_product
        } catch (error) {
            return resError(res, error)
        }
    }
}