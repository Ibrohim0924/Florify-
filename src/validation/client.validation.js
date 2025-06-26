import Joi from "joi";

export const createClientValidator = (data) =>{
    const admin = Joi.object({
        name: Joi.string().min(3).required(),
        phoneNumber: Joi.string().regex(/^\+998[-\s]?\(?\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/).required(),
        adress: Joi.string(),
        password: Joi.string().required(),
    })
    return admin.validate(data)
}

export const SignInClientValidator = (data) =>{
    const admin = Joi.object({
        phoneNumber: Joi.string().regex(/^\+998[-\s]?\(?\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/).required(),
        password: Joi.string().required()
    })
    return admin.validate(data)
}

export const UpdateClientValidator = (data) =>{
    const admin = Joi.object({
        name: Joi.string().min(4).optional(),
        phoneNumber: Joi.string().regex(/^\+998[-\s]?\(?\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/).optional(),
        adress: Joi.string(),
        password: Joi.string().optional(),
    })
    return admin.validate(data)
}