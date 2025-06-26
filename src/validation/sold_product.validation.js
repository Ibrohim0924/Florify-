import Joi from "joi";

export const createSoldProductValidator = (data) => {
    const sold_product = Joi.object({
        product_id: Joi.string().required(),
        client_id: Joi.string().required(),
        quantity: Joi.number().required(),
    })
    return sold_product.validate(data)
}

export const updateSoldProductValidator = (data) => {
    const sold_product = Joi.object({
        product_id: Joi.string().optional(),
        client_id: Joi.string().optional(),
        quantity: Joi.number().optional(),
    })
    return sold_product.validate(data)
}