import { resError } from "../helper/resError.js";
import { resSuccess } from "../helper/resSuccess.js";
import Salesman from "../model/salesman.model.js";
import { Token }  from "../utils/token-service.js"
import NodeCache from "node-cache";
import { Crypto } from "../utils/encrypt.decrypt.js";
import config from "../config/index.js";
import { generateOTP } from "../helper/generate-otp.js";
import { transporter } from "../helper/sendMail.js";
import { isValidObjectId } from "mongoose";
import { confirmSignInSalesmanValidator, createSalesmanValidator, SignInSalesmanValidator, updateSalesmanValidator } from "../validation/salesman.validation.js";

const token = new Token()
const cache = new NodeCache()
const crypto = new Crypto()

export class SalesmanController{
    async createSalesman(req, res){
        try {
            const {value, error} = createSalesmanValidator(req.body)
        if(error){
            return resError(res, error)
        }
        const existsUsername = await Salesman.findOne({username: value.username})
        if(existsUsername){
            return resError(res, 'Username already taken', 409)
        }
        const existsPhone = await Salesman.findOne({phoneNumber: value.phoneNumber})
        if(existsPhone){
            return resError(res, 'Phone number already taken', 409)
        }
        const existsEmail = await Salesman.findOne({ email: value.email})
        if(existsEmail){
            return resError(res, 'This email taken')
        }
        const hashedPassword = await crypto.encrypt(value.password)
        const salesman = await Salesman.create({
            ...value,
            hashedPassword
        })
        return resSuccess(res, {
            data: salesman,
        }, 201)
        } catch (error) {
            return resError(res, error)
        }
    }

    async signInSalesman(req, res){
        try {
        const { value, error} = SignInSalesmanValidator(req.body)
        if(error){
        return resError(res, error)
        }
        const salesman = await Salesman.findOne({email: value.email})
        if(!salesman){
            return resError(res, 'Email or Password incorrect', 400)
        }
        const passwordSecure = await crypto.encrypt(value.password, salesman.hashedPassword)
        if(!passwordSecure){
            return resError(res, 'Email or Password incorrect', 400)
        }
        const otp = generateOTP()
        const email = value.email
            const mailOptions = {
                from: config.MAIL_USER,
                to: email,
                subject: 'Florify',
                text: otp
            }
            transporter.sendMail(mailOptions, function(error , info){
                if(error){
                console.log(error)
                return resError(res, 'Error sending OTP', 400)
                }else{
                console.log(info)
            }
            })
            cache.set(email, otp, 120)
            return resSuccess(res, {
                message: 'OTP sended successfully'
            })
            } catch (error) {
            return resError(res, error)
        }
    }

    async confirmSignIn(req, res){
            try {
                const { value, error } = confirmSignInSalesmanValidator(req.body)
                if(error){
                    return resError(res, error)
                }
                const email = value.email
                const salesman = await Salesman.findOne({ email })
                if(!salesman){
                    return resError(res, 'Salesman not found', 404)
                }
                const payload = { id: salesman._id , role: salesman.role}
                const accessToken = await token.generateAccessToken(payload)
                const refreshToken = await token.generateRefreshToken(payload)
                res.cookie('refreshTokenSalesman', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    maxAge: 30 * 24 * 60 * 60 * 1000
                });
                return resSuccess(res, {
                    data: salesman,
                    token: accessToken
                }, 201);
            } catch (error) {
                return resError(res, error)
            }
        }

        async newAccessToken(req, res){
                try {
                    const refreshToken = req.cookies?.refreshTokenSalesman
                    if(!refreshToken){
                        return resError(res, 'Refresh token expired')
                    }
                    const decodedToken = await token.verifyToken(refreshToken, config.REFRESH_TOKEN_KEY)
                    if(!decodedToken){
                        return resError(res, 'Invalid Token', 400)
                    }
                    const salesman = await Salesman.findById(decodedToken.id)
                    if(!salesman){
                        return resError(res, 'Salesman not found', 404)
                    }
                    const payload = { id: salesman._id, role: salesman.role}
                    const newAccessToken = await token.generateAccessToken(payload)
                    return resSuccess(res, {
                        token: newAccessToken
                    })
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            async logOut(req, res){
                try {
                    const refreshToken = req.cookies?.refreshTokenSalesman
                    if(!refreshToken){
                        return resError(res, 'Refresh token expired')
                    }
                    const decodedToken = await token.verifyToken(refreshToken, config.REFRESH_TOKEN_KEY)
                    if(!decodedToken){
                        return resError(res, 'Invalid Token', 400)
                    }
                    const salesman = await Salesman.findOne({_id: decodedToken.id})
                    if(!salesman){
                        return resError(res, 'Salesman not found', 404)
                    }
                    res.clearCookie('refreshTokenSalesman')
                    return resSuccess(res, {message: "You have successfully logged out"})
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            async getAllSalesmans(req, res){
                try {
                    const salesman = await Salesman.find().populate('products')
                    return resSuccess(res, salesman)
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            async getSalesmanById(req, res){
                try {
                    const salesman = await SalesmanController.findSalesmanById(res, req.params.id)
                    return resSuccess(res, salesman)
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            async updateSalesmanById(req, res){
                try {
                    const id = req.params.id
                    const salesman = await SalesmanController.findSalesmanById(res, id)
                    const {value, error} = updateSalesmanValidator(req.body)
                    if(error){
                        return resError(res, error)
                    }
                    let hashedPassword = salesman.hashedPassword
                    if(value.password){
                        hashedPassword = await crypto.encrypt(value.password)
                    }
                    const updatedSalesman = await Salesman.findByIdAndUpdate(id, {
                        ...value,
                        hashedPassword
                    }, { new: true })
                    return resSuccess(res, updatedSalesman)
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            async deleteSalesmanById(req, res){
                try {
                    const id = req.params.id
                    await SalesmanController.findSalesmanById(res, id)
                    await Salesman.findByIdAndDelete(id)
                    return resSuccess(res,{message: 'Salesman deleted successfully'})
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            static async findSalesmanById(res, id){
                try {
                    if(!isValidObjectId(id)){
                        return resError(res, 'Invalid Object ID', 400)
                    }
                    const salesman = await Salesman.findById(id).populate('products')
                    if(!salesman){
                        return resError(res, 'Salesman not found', 404)
                    }
                    return salesman
                } catch (error) {
                    return resError(res, error)
                }
            }
}