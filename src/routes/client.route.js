import { Router } from "express";
import { ClientController } from "../controller/client.controller.js";
import { AuthGuard } from "../guards/auth.guard.js";
import { RolesGuard } from "../guards/roles.guard.js";
import { SelfGuard } from "../guards/self.guard.js";

const controller = new ClientController()
const router = Router()

router
    .post('/signup', controller.SignUpClient)
    .post('/signin', controller.signInclient)
    .post('/token', controller.newAccessToken)
    .post('/logout', controller.logOut)
    
    .get('/',AuthGuard, RolesGuard(['admin', 'superadmin']), controller.getAllclients)
    .get('/:id',AuthGuard, SelfGuard, controller.getClientById)
    .patch('/:id',AuthGuard, SelfGuard, controller.updateClientById)
    .delete('/:id',AuthGuard, RolesGuard(['admin', 'superadmin']), controller.deleteclientById)

export default router