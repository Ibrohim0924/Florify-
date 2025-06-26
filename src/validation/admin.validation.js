import Joi from "joi";

export const createAdminValidator = (data) =>{
    const admin = Joi.object({
        username: Joi.string().min(4).required(),
        email: Joi.string().email().required(),
        phoneNumber: Joi.string().regex(/^\+998[-\s]?\(?\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/).required(),
        password: Joi.string().required(),
    })
    return admin.validate(data)
}

export const confirmSignInAdminValidator = (data) =>{
    const admin = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required()
    })
    return admin.validate(data)
}

export const signInAdminValidator = (data) =>{
    const admin = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
    return admin.validate(data)
}

export const updateAdminValidator = (data) =>{
    const admin = Joi.object({
        username: Joi.string().min(4).optional(),
        email: Joi.string().email().optional(),
        phoneNumber: Joi.string().regex(/^\+998[-\s]?\(?\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/).optional(),
        password: Joi.string().optional(),
    })
    return admin.validate(data)
}