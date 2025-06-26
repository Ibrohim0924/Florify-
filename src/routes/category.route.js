import { Router } from "express";
import { CategoryController } from "../controller/category.controller.js";
import { AuthGuard } from "../guards/auth.guard.js";
import { RolesGuard } from "../guards/roles.guard.js";

const controller = new CategoryController()
const router = Router()

router 
    .post('/',AuthGuard, RolesGuard(['admin', 'superadmin']), controller.createCategory)
    .get('/',AuthGuard, RolesGuard(['admin', 'superadmin']) , controller.getAllCategories)
    .get('/:id', AuthGuard, RolesGuard(['admin', 'superadmin']),controller.getCategoryById)
    .patch('/:id',AuthGuard, RolesGuard(['admin', 'superadmin']), controller.updateCategoryById)
    .delete('/:id',AuthGuard, RolesGuard(['admin', 'superadmin']), controller.deleteCategoryById)
    
export default router