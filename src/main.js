import express from "express";
import config from "./config/index.js";
import { ConnectDB } from "./db/index.js";
import { createSuperadmin } from "./db/createsuperadmin.js";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import manga application routes
import mangaRoutes from './routes/mangaRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// Import existing routes (keeping for backwards compatibility)
import adminRouter from './routes/admin.route.js'
import salesmanRouter from './routes/salesman.route.js'
import clientRouter from './routes/client.route.js'
import categoryRouter from './routes/category.route.js'
import productRouter from './routes/product.route.js'
import soldProductRouter from './routes/sold_product.route.js'

const app = express()

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Connect to database and create superadmin
await ConnectDB()
await createSuperadmin()

// API Routes for Manga Application
app.use('/api/manga', mangaRoutes)
app.use('/api/users', userRoutes)
app.use('/api/reviews', reviewRoutes)

// Legacy routes (keeping for backwards compatibility)
app.use('/admin', adminRouter)
app.use('/salesman', salesmanRouter)
app.use('/client', clientRouter)
app.use('/category', categoryRouter)
app.use('/product', productRouter)
app.use('/sold_product', soldProductRouter)

// Welcome route for manga application
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Manga Reader API',
    version: '1.0.0',
    endpoints: {
      manga: '/api/manga',
      users: '/api/users',
      reviews: '/api/reviews'
    },
    documentation: {
      manga: {
        'GET /api/manga': 'Get all manga with filtering and pagination',
        'GET /api/manga/popular': 'Get popular manga',
        'GET /api/manga/latest': 'Get latest manga',
        'GET /api/manga/featured': 'Get featured manga',
        'GET /api/manga/search': 'Search manga',
        'GET /api/manga/:id': 'Get manga by ID',
        'GET /api/manga/:id/recommendations': 'Get recommendations for manga'
      },
      users: {
        'POST /api/users/register': 'Register new user',
        'POST /api/users/login': 'Login user',
        'GET /api/users/profile': 'Get user profile (auth required)',
        'GET /api/users/favorites': 'Get user favorites (auth required)',
        'GET /api/users/reading-list': 'Get user reading list (auth required)'
      },
      reviews: {
        'GET /api/reviews/manga/:mangaId': 'Get reviews for manga',
        'POST /api/reviews/manga/:mangaId': 'Create review (auth required)',
        'GET /api/reviews/featured': 'Get featured reviews'
      }
    }
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

app.listen(config.PORT, () => {
    console.log('🚀 Manga Reader Server running on PORT', +config.PORT)
    console.log('📚 API Documentation available at http://localhost:' + config.PORT)
})