import { Router } from "express";
import { AdminController } from "../controller/admin.controller.js";
import { AuthGuard } from "../guards/auth.guard.js";
import { RolesGuard } from "../guards/roles.guard.js";

const router = Router()
const controller = new AdminController()

router
    .post('/',AuthGuard, RolesGuard(['superadmin']), controller.createAdmin)
    .post('/signin', controller.signInAdmin)
    .post('/confirm-signin', controller.confirmSignIn)
    .post('/token', controller.newAccessToken)
    .post('/logout', controller.logOut)
    
    .get('/',AuthGuard, RolesGuard(['superadmin']), controller.getAllAdmins)
    .get('/:id',AuthGuard, RolesGuard(['superadmin']), controller.getAdminById)
    .patch('/:id',AuthGuard, RolesGuard(['superadmin']), controller.updateAdminById)
    .delete('/:id',AuthGuard, RolesGuard(['superadmin']), controller.deleteAdminById)


export default router