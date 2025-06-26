import { Token } from "../utils/token-service.js";
import { resError } from "../helper/resError.js";
import { resSuccess } from "../helper/resSuccess.js";
import { Crypto } from "../utils/encrypt.decrypt.js";
import { SignInClientValidator, createClientValidator, UpdateClientValidator } from "../validation/client.validation.js";
import config from "../config/index.js";
import Client from "../model/client.model.js";
import { isValidObjectId } from "mongoose";

const token = new Token()
const crypto = new Crypto()

export class ClientController{
    async SignUpClient(req, res){
        try {
            const {value, error} = createClientValidator(req.body)
        if(error){
            return resError(res, error)
        }
        const existsPhone = await Client.findOne({phoneNumber: value.phoneNumber})
        if(existsPhone){
            return resError(res, 'Phone number already taken', 409)
        }
        const hashedPassword = await crypto.encrypt(value.password)
        const client = await Client.create({
            ...value,
            hashedPassword
        })
        return resSuccess(res, {
            data: client,
        }, 201)
        } catch (error) {
            return resError(res, error)
        }
    }

    async signInclient(req, res){
        try {
        const { value, error} = SignInClientValidator(req.body)
        if(error){
        return resError(res, error)
        }
        const client = await Client.findOne({phoneNumber: value.phoneNumber})
        if(!client){
            return resError(res, 'PhoneNumber or Password incorrect', 400)
        }
        const passwordSecure = await crypto.encrypt(value.password, client.hashedPassword)
        if(!passwordSecure){
            return resError(res, 'PhoneNumber or Password incorrect', 400)
        }
        const payload = { id: client._id , role: client.role}
            const accessToken = await token.generateAccessToken(payload)
            const refreshToken = await token.generateRefreshToken(payload)
            res.cookie('refreshTokenClient', refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            return resSuccess(res, {
                data: client,
                token: accessToken
            }, 201);
        } catch (error) {
            return resError(res, error)
        }
    }

    async newAccessToken(req, res){
        try {
            const refreshToken = req.cookies?.refreshTokenClient
            if(!refreshToken){
                return resError(res, 'Refresh token expired')
            }
                const decodedToken = await token.verifyToken(refreshToken, config.REFRESH_TOKEN_KEY)
                if(!decodedToken){
                    return resError(res, 'Invalid Token', 400)
                }
                const client = await Client.findById(decodedToken.id)
                if(!client){
                    return resError(res, 'Client not found', 404)
                }
                const payload = { id: client._id, role: client.role}
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
                const refreshToken = req.cookies?.refreshTokenClient
                if(!refreshToken){
                    return resError(res, 'Refresh token expired')
                }
                const decodedToken = await token.verifyToken(refreshToken, config.REFRESH_TOKEN_KEY)
                if(!decodedToken){
                    return resError(res, 'Invalid Token', 400)
                }
                const client = await Client.findOne({_id: decodedToken.id})
                if(!client){
                    return resError(res, 'Client not found', 404)
                }
                res.clearCookie('refreshTokenClient')
                return resSuccess(res, {message: "You have successfully logged out"})
            } catch (error) {
                return resError(res, error)
            }
        }
        
        async getAllclients(_, res){
            try {
                const client = await Client.find().populate('sold_product')
                return resSuccess(res, client)
            } catch (error) {
                return resError(res, error)
            }
        }
        
            async getClientById(req, res){
                try {
                    const client = await ClientController.findClientById(res, req.params.id)
                    return resSuccess(res, client)
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            async updateClientById(req, res){
                try {
                    const id = req.params.id
                    const client = await ClientController.findClientById(res, id)
                    const {value, error} = UpdateClientValidator(req.body)
                    if(error){
                        return resError(res, error)
                    }
                    let hashedPassword = client.hashedPassword
                    if(value.password){
                        hashedPassword = await crypto.encrypt(value.password)
                    }
                    const updatedClient = await Client.findByIdAndUpdate(id, {
                        ...value,
                        hashedPassword
                    }, { new: true })
                    return resSuccess(res, updatedClient)
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            async deleteclientById(req, res){
                try {
                    const id = req.params.id
                    await ClientController.findClientById(res, id)
                    await Client.findByIdAndDelete(id)
                    return resSuccess(res,{message: 'Client deleted successfully'})
                } catch (error) {
                    return resError(res, error)
                }
            }
        
            static async findClientById(res, id){
                try {
                    if(!isValidObjectId(id)){
                        return resError(res, 'Invalid Object ID', 400)
                    }
                    const client = await Client.findById(id).populate('sold_product')
                    if(!client){
                        return resError(res, 'Client not found', 404)
                    }
                    return client
                } catch (error) {
                    return resError(res, error)
                }
            }
}
