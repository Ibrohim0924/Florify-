import { Router } from "express";
import { SoldProductController } from "../controller/sold_product.controller.js";
import { AuthGuard } from "../guards/auth.guard.js";
import { RolesGuard } from "../guards/roles.guard.js";

const router = Router()
const controller = new SoldProductController()

router 
    .post('/', AuthGuard, RolesGuard(['salesman', 'admin', 'superadmin']),controller.createSoldProduct)
    .get('/',AuthGuard, RolesGuard(['salesman', 'admin', 'superadmin']), controller.getAllSoldProducts)
    .get('/:id',AuthGuard, RolesGuard(['salesman','admin', 'superadmin']), controller.getSoldProductById)
    .patch('/:id',AuthGuard, RolesGuard(['salesman','admin', 'superadmin']), controller.updateSoldProductById)
    .delete('/:id',AuthGuard, RolesGuard(['salesman', 'admin', 'superadmin']), controller.deleteSoldProductById)

export default router