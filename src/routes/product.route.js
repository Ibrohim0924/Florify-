import { Router } from "express";
import { ProductController } from "../controller/product.controller.js";
import { AuthGuard } from "../guards/auth.guard.js";
import { RolesGuard } from "../guards/roles.guard.js";

const router = Router()
const controller = new ProductController()

router
    .post('/',AuthGuard, RolesGuard(['salesman', 'superadmin']), controller.createProduct)
    .get('/', AuthGuard, RolesGuard(['salesman', 'admin', 'superadmin']), controller.getAllProducts)
    .get('/:id',AuthGuard, RolesGuard(['salesman',  'admin', 'superadmin']), controller.getProductById)
    .patch('/:id',AuthGuard, RolesGuard(['salesman',  'admin', 'superadmin']), controller.updateProductById)
    .delete('/:id',AuthGuard, RolesGuard(['salesman',  'admin', 'superadmin']), controller.deleteProductById)

export default router