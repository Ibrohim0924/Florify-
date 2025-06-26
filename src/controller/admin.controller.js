import { resSuccess } from "../helper/resSuccess.js";
import { resError } from "../helper/resError.js";
import { Crypto } from "../utils/encrypt.decrypt.js";
import Admin from "../model/admin.model.js";
import { Token } from "../utils/token-service.js";
import { confirmSignInAdminValidator, createAdminValidator, signInAdminValidator, updateAdminValidator } from "../validation/admin.validation.js";
import { isValidObjectId } from "mongoose";
import config from "../config/index.js";
import { generateOTP } from "../helper/generate-otp.js";
import { transporter } from "../helper/sendMail.js";
import NodeCache from "node-cache";

const cache = new NodeCache()
const token = new Token()
const crypto = new Crypto()

export class AdminController {

    async createAdmin(req, res){
        try{
        const {value, error} = createAdminValidator(req.body)
        if(error){
            return resError(res, error)
        }
        const existsUsername = await Admin.findOne({username: value.username})
        if(existsUsername){
            return resError(res, 'Username already taken', 409)
        }
        const existsPhone = await Admin.findOne({phoneNumber: value.phoneNumber})
        if(existsPhone){
            return resError(res, 'Phone number already taken', 409)
        }
        const existsEmail = await Admin.findOne({ email: value.email})
        if(existsEmail){
            return resError(res, 'This email taken')
        }
        const hashedPassword = await crypto.encrypt(value.password)
        const admin = await Admin.create({
            ...value,
            hashedPassword
        })
        return resSuccess(res, {
            data: admin,
        }, 201)
     }catch(error){
        return resError(res, error)
     }
    }

    async signInAdmin(req, res){
        try {
        const { value, error} = signInAdminValidator(req.body)
        if(error){
            return resError(res, error)
        }
        const admin = await Admin.findOne({email: value.email})
        if(!admin){
            return resError(res, 'Email or Password incorrect', 400)
        }
        const passwordSecure = await crypto.encrypt(value.password, admin.hashedPassword)
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
            const { value, error } = confirmSignInAdminValidator(req.body)
            if(error){
                return resError(res, error)
            }
            const email = value.email
            const admin = await Admin.findOne({ email })
            if(!admin){
                return resError(res, 'Admin not found', 404)
            }
            const payload = { id: admin._id , role: admin.role}
            const accessToken = await token.generateAccessToken(payload)
            const refreshToken = await token.generateRefreshToken(payload)
            res.cookie('refreshTokenAdmin', refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            return resSuccess(res, {
                data: admin,
                token: accessToken
            }, 201);
        } catch (error) {
            return resError(res, error)
        }
    }

    async newAccessToken(req, res){
        try {
            const refreshToken = req.cookies?.refreshTokenAdmin
            if(!refreshToken){
                return resError(res, 'Refresh token expired')
            }
            const decodedToken = await token.verifyToken(refreshToken, config.REFRESH_TOKEN_KEY)
            if(!decodedToken){
                return resError(res, 'Invalid Token', 400)
            }
            const admin = await Admin.findById(decodedToken.id)
            if(!admin){
                return resError(res, 'Admin not found', 404)
            }
            const payload = { id: admin._id, role: admin.role}
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
            const refreshToken = req.cookies?.refreshTokenAdmin
            if(!refreshToken){
                return resError(res, 'Refresh token expired')
            }
            const decodedToken = await token.verifyToken(refreshToken, config.REFRESH_TOKEN_KEY)
            if(!decodedToken){
                return resError(res, 'Invalid Token', 400)
            }
            const admin = await Admin.findOne({_id: decodedToken.id})
            if(!admin){
                return resError(res, 'Admin not found', 404)
            }
            res.clearCookie('refreshTokenAdmin')
            return resSuccess(res, {message: "You have successfully logged out"})
        } catch (error) {
            return resError(res, error)
        }
    }

    async getAllAdmins(req, res){
        try {
            const admin = await Admin.find()
            return resSuccess(res, admin)
        } catch (error) {
            return resError(res, error)
        }
    }

    async getAdminById(req, res){
        try {
            const admin = await AdminController.findAdminById(res, req.params.id)
            return resSuccess(res, admin)
        } catch (error) {
            return resError(res, error)
        }
    }

    async updateAdminById(req, res){
        try {
            const id = req.params.id
            const admin = await AdminController.findAdminById(res, id)
            const {value, error} = updateAdminValidator(req.body)
            if(error){
                return resError(res, error)
            }
            let hashedPassword = admin.hashedPassword
            if(value.password){
                hashedPassword = await crypto.encrypt(value.password)
            }
            const updatedAdmin = await Admin.findByIdAndUpdate(id, {
                ...value,
                hashedPassword
            }, { new: true })
            return resSuccess(res, updatedAdmin)
        } catch (error) {
            return resError(res, error)
        }
    }
    

    async deleteAdminById(req, res){
        try {
            const id = req.params.id
            await AdminController.findAdminById(res, id)
            await Admin.findByIdAndDelete(id)
            return resSuccess(res,{message: 'Admin deleted successfully'})
        } catch (error) {
            return resError(res, error)
        }
    }

    static async findAdminById(res, id){
        try {
            if(!isValidObjectId(id)){
                return resError(res, 'Invalid Object ID', 400)
            }
            const admin = await Admin.findById(id)
            if(!admin){
                return resError(res, 'Admin not found', 404)
            }
            return admin
        } catch (error) {
            return resError(res, error)
        }
    }
}