# Amrita Pulse Backend

Campus Event Discovery Platform API built with Node.js, Express, and MongoDB.

## Features
- JWT-based authentication
- Role-based access control (Student, Club, Admin)
- @amrita.edu email restriction
- Interest-based event filtering
- Cloudinary image uploads
- Event moderation and analytics
- Notification system

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (see `.env.example`):
```
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

3. Run the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get filtered events (interest-based for students)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (club/admin)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Admin
- `GET /api/admin/events/pending` - Get pending events
- `PUT /api/admin/events/:id/approve` - Approve event
- `PUT /api/admin/events/:id/reject` - Reject event
- `PUT /api/admin/events/:id/feature` - Feature event
- `POST /api/admin/announcement` - Send announcement
- `GET /api/admin/stats` - Platform statistics

### Club
- `GET /api/club/events` - Get club's events
- `GET /api/club/analytics/:eventId` - Event analytics

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Models

### User
- name, email (@amrita.edu only), password
- role: student | club | admin
- Student: department, year, interests[]
- Club: clubName

### Event
- title, description, organizer, category
- venue, eventDate, eventTime
- posterImage (Cloudinary URL)
- status: pending | approved | rejected
- Analytics: views, registrations

### Notification
- user, event, type, message
- read status

## Deployment
Deploy to Render or Railway with MongoDB Atlas.
