import Joi from "joi";

            export const createSalesmanValidator = (data) => {
                const salesman = Joi.object({
                    username: Joi.string().min(4).required(),
                    fullName: Joi.string().required(),
                    adress: Joi.string().required(),
                    email: Joi.string().email().required(),
                    phoneNumber: Joi.string().regex(/^\+998[-\s]?\(?\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/).required(),
                    password: Joi.string().required(),
                })
                return salesman.validate(data)
            }

export const SignInSalesmanValidator = (data) => {
    const salesman = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
    return salesman.validate(data)
}

export const confirmSignInSalesmanValidator = (data) => {
    const salesman = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required()
    })
    return salesman.validate(data)
}

export const updateSalesmanValidator = (data) => {
    const salesman = Joi.object({
        username: Joi.string().min(4).optional(),
        fullName: Joi.string().optional(),
        adress: Joi.string().optional(),
        email: Joi.string().email().optional(),
        phoneNumber: Joi.string().regex(/^\+998[-\s]?\(?\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/).optional(),
        password: Joi.string().optional(),
    })
    return salesman.validate(data)
}