import { Router } from "express";
import { SalesmanController } from "../controller/salesman.controller.js";
import { SelfGuard } from "../guards/self.guard.js";
import { RolesGuard } from "../guards/roles.guard.js";
import { AuthGuard } from "../guards/auth.guard.js";

const controller = new SalesmanController()
const router = Router()

router
    .post('/',AuthGuard, RolesGuard(['admin', 'superadmin']), controller.createSalesman)
    .post('/signin', controller.signInSalesman)
    .post('/confirm-signin', controller.confirmSignIn)
    .post('/token', controller.newAccessToken)
    .post('/logout', controller.logOut)
    
    .get('/',AuthGuard, RolesGuard(['admin', 'superadmin']), controller.getAllSalesmans)
    .get('/:id',AuthGuard, SelfGuard ,controller.getSalesmanById)
    .patch('/:id',AuthGuard, SelfGuard , controller.updateSalesmanById)
    .delete('/:id',AuthGuard, RolesGuard(['admin', 'superadmin']), controller.deleteSalesmanById)

export default router