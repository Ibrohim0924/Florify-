import { Token } from '../utils/token-service.js'
import { resError } from '../helper/resError.js'
import config from '../config/index.js'

const tokenService = new Token()

export const AuthGuard = async (req, res, next) => {
    const auth = req.headers.authorization
    if(!auth){
        return resError(res, 'Authorization error', 401)
    }
    const bearer = auth.split(' ')[0]
    const token = auth.split(' ')[1]
    if(!bearer || bearer != 'Bearer' || !token){
        return resError(res, 'Token error', 402)
    }
    try {
        const user = await tokenService.verifyToken(
            token, 
            config.ACCESS_TOKEN_KEY
        )
        req.user = user
        next()
    } catch (error) {
        return resError(res, 'Unauthorized')
    }
}
