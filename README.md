# 📚 Manga Reader API

A comprehensive manga reading platform built with Node.js, Express, and MongoDB. This application provides a complete backend solution for manga management, user authentication, reading progress tracking, and review systems.

## ✨ Features

### 📖 Manga Management
- Browse manga with advanced filtering and pagination
- Search functionality with full-text search
- Popular, latest, and featured manga endpoints
- Detailed manga information with ratings and statistics
- Chapter management with page-by-page reading
- Recommendation system based on user preferences

### 👤 User System
- User registration and authentication with JWT
- User profiles with reading preferences
- Personal manga library (favorites, reading list)
- Reading progress tracking per chapter and page
- Reading history with timestamps
- Comprehensive user statistics

### ⭐ Review & Rating System
- User reviews with ratings, pros/cons
- Review helpfulness voting system
- Reply to reviews functionality
- Review moderation and flagging system
- Featured reviews showcase

### 🔐 Advanced Features
- Role-based access control (User, Moderator, Admin, Translator)
- Rate limiting for API protection
- CORS support for frontend integration
- Comprehensive error handling
- Database indexing for optimal performance

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd manga-reader-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/manga_reader
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
NODE_ENV=development
```

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Seed the database**
```bash
npm run seed:manga
```

6. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📋 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 🎯 API Endpoints

### 👤 User Endpoints

#### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

#### Profile Management
- `GET /api/users/profile` - Get user profile (auth required)
- `PUT /api/users/profile` - Update user profile (auth required)
- `GET /api/users/stats` - Get user statistics (auth required)

#### Library Management
- `GET /api/users/favorites` - Get user's favorite manga (auth required)
- `POST /api/users/favorites/:mangaId` - Add manga to favorites (auth required)
- `DELETE /api/users/favorites/:mangaId` - Remove from favorites (auth required)
- `GET /api/users/reading-list` - Get reading list (auth required)
- `PUT /api/users/reading-list/:mangaId` - Update reading progress (auth required)
- `GET /api/users/history` - Get reading history (auth required)
- `GET /api/users/recommendations` - Get personalized recommendations (auth required)

### 📚 Manga Endpoints

#### Browse & Search
- `GET /api/manga` - Get all manga with filtering and pagination
- `GET /api/manga/popular` - Get popular manga
- `GET /api/manga/latest` - Get latest manga
- `GET /api/manga/featured` - Get featured manga
- `GET /api/manga/search` - Search manga
- `GET /api/manga/stats` - Get manga statistics

#### Manga Details
- `GET /api/manga/:id` - Get manga by ID
- `GET /api/manga/:id/recommendations` - Get similar manga recommendations

#### Chapter Management
- `GET /api/manga/:mangaId/chapters` - Get all chapters for a manga
- `GET /api/manga/chapters/latest` - Get latest chapter updates
- `GET /api/manga/chapters/popular` - Get popular chapters
- `GET /api/manga/chapters/:id` - Get chapter with pages
- `GET /api/manga/chapters/:id/pages/:pageNumber` - Get specific page

#### Admin/Translator Only
- `POST /api/manga` - Create new manga (admin/translator)
- `PUT /api/manga/:id` - Update manga (admin/translator)
- `DELETE /api/manga/:id` - Delete manga (admin only)
- `POST /api/manga/:mangaId/chapters` - Create chapter (admin/translator)
- `PUT /api/manga/chapters/:id` - Update chapter (admin/translator)
- `DELETE /api/manga/chapters/:id` - Delete chapter (admin/translator)

### ⭐ Review Endpoints

#### Public Reviews
- `GET /api/reviews/featured` - Get featured reviews
- `GET /api/reviews/manga/:mangaId` - Get reviews for a manga
- `GET /api/reviews/user/:userId` - Get user's reviews
- `GET /api/reviews/:id` - Get review by ID

#### Review Management (Auth Required)
- `POST /api/reviews/manga/:mangaId` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/vote` - Vote on review helpfulness
- `POST /api/reviews/:id/reply` - Reply to review
- `POST /api/reviews/:id/flag` - Flag inappropriate review

## 📊 Query Parameters

### Manga Filtering
```
GET /api/manga?page=1&limit=20&genre=Action&status=Ongoing&sort=rating.average&order=desc
```

Available filters:
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)
- `genre` - Filter by genre
- `status` - Filter by status (Ongoing, Completed, Hiatus, Cancelled)
- `type` - Filter by type (Manga, Manhwa, Manhua, Novel, One-shot)
- `year` - Filter by release year
- `rating` - Minimum rating filter
- `sort` - Sort field (title, rating.average, popularity.views, createdAt)
- `order` - Sort order (asc, desc)
- `search` - Search query
- `featured` - Show only featured manga (true/false)

### Search Examples
```
GET /api/manga/search?q=one piece
GET /api/manga?genre=Action&genre=Adventure&status=Ongoing
GET /api/manga?sort=popularity.views&order=desc&limit=10
```

## 🔧 Data Models

### Manga Schema
```javascript
{
  title: String,
  alternativeTitles: [String],
  author: String,
  artist: String,
  description: String,
  genres: [String],
  status: String, // Ongoing, Completed, Hiatus, Cancelled
  type: String,   // Manga, Manhwa, Manhua, Novel, One-shot
  coverImage: String,
  releaseYear: Number,
  rating: {
    average: Number,
    count: Number
  },
  popularity: {
    views: Number,
    favorites: Number,
    followers: Number
  },
  chapters: [ObjectId],
  tags: [String],
  featured: Boolean,
  ageRating: String,
  language: String
}
```

### User Schema
```javascript
{
  username: String,
  email: String,
  password: String,
  profile: {
    displayName: String,
    avatar: String,
    bio: String
  },
  preferences: {
    readingMode: String,
    pageLayout: String,
    language: String,
    notifications: Object
  },
  library: {
    favorites: [{mangaId, addedAt}],
    readingList: [{mangaId, status, progress, lastRead}],
    readHistory: [{mangaId, chapterId, readAt, completed}]
  },
  stats: {
    chaptersRead: Number,
    pagesRead: Number,
    timeSpent: Number
  },
  role: String // user, moderator, admin, translator
}
```

## 🛠️ Development

### Project Structure
```
src/
├── controller/          # Route controllers
│   ├── mangaController.js
│   ├── chapterController.js
│   ├── userController.js
│   └── reviewController.js
├── model/              # Database models
│   ├── manga.js
│   ├── chapter.js
│   ├── user.js
│   └── review.js
├── routes/             # API routes
│   ├── mangaRoutes.js
│   ├── userRoutes.js
│   └── reviewRoutes.js
├── guards/             # Authentication middleware
│   └── authGuard.js
├── db/                 # Database configuration
│   ├── index.js
│   ├── seedManga.js
│   └── createsuperadmin.js
├── config/             # Configuration files
└── main.js            # Application entry point
```

### Available Scripts
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run seed:manga  # Seed database with sample manga
npm run superadmin  # Create superadmin user
```

### Adding New Features

1. **Create Model** - Add new Mongoose schema in `src/model/`
2. **Create Controller** - Add business logic in `src/controller/`
3. **Create Routes** - Add API endpoints in `src/routes/`
4. **Update Main** - Register routes in `src/main.js`

## 🔒 Authentication & Authorization

### User Roles
- **User** - Basic manga reading, reviews, library management
- **Translator** - Can create and manage manga/chapters
- **Moderator** - Can moderate reviews and user content
- **Admin** - Full system access

### JWT Token Format
```javascript
{
  id: "user_id",
  username: "username",
  role: "user",
  iat: timestamp,
  exp: timestamp
}
```

## 📱 Frontend Integration

### CORS Configuration
The API supports CORS for these origins:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:8080`

### Example Frontend Usage
```javascript
// Register user
const response = await fetch('/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'reader1',
    email: 'reader@example.com',
    password: 'password123'
  })
});

// Get manga with authentication
const manga = await fetch('/api/manga', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🐛 Error Handling

All API responses follow this format:
```javascript
// Success
{
  success: true,
  data: {...},
  message: "Optional message"
}

// Error
{
  success: false,
  message: "Error description",
  error: "Detailed error (development only)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-very-secure-jwt-secret
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start src/main.js --name "manga-api"
pm2 startup
pm2 save
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

**Happy manga reading! 📚✨**