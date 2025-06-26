import Joi from "joi";

export const createProductValidator = (data) => {
    const product = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required(),
        quantity: Joi.number().required(),
        color: Joi.string().required(),
        category_id: Joi.string().required(),
        salesman_id: Joi.string().required()
    })
    return product.validate(data)
}

export const UpdateProductValidator = (data) => {
    const product = Joi.object({
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        price: Joi.number().optional(),
        quantity: Joi.number().optional(),
        color: Joi.string().optional(),
        category_id: Joi.string().optional(),
        salesman_id: Joi.string().optional()
    })
    return product.validate(data)
}

