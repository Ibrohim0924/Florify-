import express from "express";
import config from "./config/index.js";
import { ConnectDB } from "./db/index.js";
import { createSuperadmin } from "./db/createsuperadmin.js";
import adminRouter from './routes/admin.route.js'
import salesmanRouter from './routes/salesman.route.js'
import clientRouter from './routes/client.route.js'
import categoryRouter from './routes/category.route.js'
import productRouter from './routes/product.route.js'
import soldProductRouter from './routes/sold_product.route.js'
import cookieParser from "cookie-parser";


const app = express()
app.use(cookieParser())


app.use(express.json())

await ConnectDB()
await createSuperadmin()

app.use('/admin', adminRouter)
app.use('/salesman', salesmanRouter)
app.use('/client', clientRouter)
app.use('/category', categoryRouter)
app.use('/product', productRouter)
app.use('/sold_product',soldProductRouter)

app.listen(config.PORT, ()=> {
    console.log('Server running on PORT', +config.PORT)
})