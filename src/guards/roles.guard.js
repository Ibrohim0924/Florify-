import { resError } from "../helper/resError.js";

export const RolesGuard = (includeRoles = []) => {
    return (req, res, next) => {
        if(!includeRoles.includes(req.user?.role)){
            return resError(res, 'Forbidden user', 403)
        }
        next()
    }
}