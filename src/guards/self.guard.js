import { resError } from "../helper/resError.js"

export const SelfGuard = (req, res, next) => {
    if(req.user?.role === 'superadmin' || req.user?.id == req.params?.id ){
        return next()
    }else{
        return resError(res, 'Forbidden user', 403)
    }
}