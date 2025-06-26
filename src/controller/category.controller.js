import { resSuccess } from "../helper/resSuccess.js";
import { resError } from "../helper/resError.js";
import { isValidObjectId } from "mongoose";
import Category from "../model/category.model.js";
import { createCategoryValidator, updateCategoryValidator } from "../validation/category.validation.js";

export class CategoryController {
    async createCategory(req, res){
        try {
            const { value, error} = createCategoryValidator(req.body)
            if(error){
                return resError(res, error)
            }
            const category = await Category.create({
                ...value
            })
            return resSuccess(res, category)
        } catch (error) {
            return resError(res, error)
        }
    }

    async getAllCategories(_, res){
        try {
            const category = await Category.find().populate('products')
            return resSuccess(res, category)
        } catch (error) {
            return resError(res, error)
        }
    }

    async getCategoryById(req, res){
        try {
            const category = await CategoryController.findCategoryById(res, req.params.id)
            return resSuccess(res, category)
        } catch (error) {
            return resError(res, error)
        }
    }
   
    async updateCategoryById(req, res){
        try {
            const id = req.params.id
            const category = await CategoryController.findCategoryById(res, id)
            const { value, error } = updateCategoryValidator(req.body)
            if(error){
                return resError(res, error)
            }
            const updatedCategory = await Category.findByIdAndUpdate(id, {
                ...value
            })
            return resSuccess(res, updatedCategory)
        } catch (error) {
            return resError(res, error)
        }
    }

    async deleteCategoryById(req, res){
        try {
            const id = req.params.id
            await CategoryController.findCategoryById(res, id)
            await Category.findByIdAndDelete(id)
            return resSuccess(res, {
                message: 'Category deleted successfully'
            })
        } catch (error) {
            return resError(res, error)
        }
    }

    static async findCategoryById(res, id){
        try {
            if(!isValidObjectId(id)){
                return resError(res, 'Invalid Object ID', 400)
            }
            const category = await Category.findById(id).populate('products')
            if(!category){
                return resError(res, 'Category not found', 404)
            }
                return category
            } catch (error) {
                return resError(res, error)
            }
        }

}