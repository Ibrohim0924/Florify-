import Joi from "joi";

export const createCategoryValidator = (data) => {
    const category = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional()
    })
    return category.validate(data)
}

export const updateCategoryValidator = (data) => {
    const category = Joi.object({
        name: Joi.string().optional(),
        description: Joi.string().optional()
    })
    return category.validate(data)
}