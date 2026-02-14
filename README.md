# Amrita Pulse - Campus Event Discovery Platform

> **Feel the campus beat** 🎓

A complete, production-ready web application designed to centralize campus event discovery at Amrita Vishwa Vidyapeetham, Bengaluru.

![Amrita Branding](https://img.shields.io/badge/Amrita-Maroon%20%23AF0C3E-maroon)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)

---

## 🎯 Project Overview

### Problem Statement
At Amrita Bengaluru campus, students miss important events due to fragmented promotion across WhatsApp, Instagram, emails, and physical posters. Clubs struggle with low turnout, and there's no centralized system for event discovery.

### Solution
**Amrita Pulse** is a centralized platform where:
- ✅ All campus events are in one place
- ✅ Students see only events matching their interests (NO AI, pure filtering logic)
- ✅ Clubs can easily promote events
- ✅ Admins monitor and moderate content

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** (App Router with TypeScript)
- **Tailwind CSS** (Custom Amrita branding theme)
- **React Icons** for UI elements
- **Axios** for API calls

### Backend
- **Node.js** with **Express.js**
- **MongoDB Atlas** with Mongoose ODM
- **JWT** authentication
- **Cloudinary** for image storage
- **Bcrypt** for password hashing

### Deployment (Free Tiers)
- Frontend: **Vercel**
- Backend: **Render** or **Railway**
- Database: **MongoDB Atlas** (Free 512MB)
- Media: **Cloudinary** (Free 25 credits/month)

---

## 🎨 Design & Branding

The UI follows official **Amrita Vishwa Vidyapeetham, Bengaluru** branding:

| Color | Hex Code | Usage |
|-------|----------|-------|
| Maroon | `#AF0C3E` | Primary (headers, buttons, branding) |
| Yellow | `#FFD92A` | Accent (CTAs, highlights) |
| Light BG | `#FDF8F9` | Background sections |
| Text Dark | `#333333` | Primary text |
| Text Gray | `#656565` | Secondary text |

**Typography:** Montserrat (Google Fonts)

---

## 🚀 Features

### 1️⃣ Authentication
- Register with **@amrita.edu email only**
- Role-based access: **Student**, **Club Organizer**, **Admin**
- JWT-based secure sessions

### 2️⃣ Interest-Based Event Feed (CRITICAL)
**How it works:**
1. Students select interests during registration (e.g., Hackathons, Cultural Events)
2. Backend filters events: `event.category IN user.interests`
3. Feed shows ONLY matching events (no AI/ML)

**Example:**
- Student interests: `['Hackathons', 'Tech Workshops']`
- Will see: hackathons and workshops
- Won't see: sports, cultural events

### 3️⃣ Event Management
**For Club Organizers:**
- Create events with image upload (Cloudinary)
- Track views and registrations
- Edit/delete events

**For Admins:**
- Approve/reject pending events
- Feature important events
- Send campus-wide announcements
- View platform statistics

### 4️⃣ Smart Features
- Google Calendar integration ("Add to Calendar" button)
- Event reminders (1 day + 2 hours before)
- Registration tracking
- Responsive design (mobile + desktop)

---

## 📁 Project Structure

```
AmritaPulse/
├── backend/
│   ├── config/          # Database, Cloudinary config
│   ├── models/          # User, Event, Notification schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # JWT auth, role checks
│   ├── utils/           # Helper functions
│   ├── server.js        # Express app entry
│   └── .env.example     # Environment variables template
│
├── frontend/
│   ├── app/             # Next.js App Router pages
│   │   ├── login/       # Login page
│   │   ├── register/    # Multi-step registration
│   │   ├── student/     # Student dashboard
│   │   ├── club/        # Club organizer dashboard
│   │   ├── admin/       # Admin panel
│   │   └── events/[id]/ # Event detail page
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Navbar, Footer, EventCard
│   │   ├── student/     # Student-specific components
│   │   ├── club/        # Club-specific components
│   │   └── admin/       # Admin-specific components
│   ├── lib/             # Utility functions, API client
│   └── tailwind.config.ts  # Amrita branding theme
│
└── README.md
```

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free)
- Cloudinary account (free)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd AmritaPulse
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (copy from `.env.example`):
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/amrita-pulse
JWT_SECRET=your-super-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=5000
FRONTEND_URL=http://localhost:3000
```

Start backend:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login
- `GET /me` - Get current user
- `PUT /update-interests` - Update student interests

### Events (`/api/events`)
- `GET /` - Get filtered events (interest-based for students)
- `GET /:id` - Get event details
- `POST /` - Create event (club/admin)
- `PUT /:id` - Update event
- `DELETE /:id` - Delete event
- `POST /:id/register` - Track registration

### Admin (`/api/admin`)
- `GET /events/pending` - Pending events
- `PUT /events/:id/approve` - Approve event
- `PUT /events/:id/reject` - Reject event
- `PUT /events/:id/feature` - Feature event
- `POST /announcement` - Send announcement
- `GET /stats` - Platform statistics

---

## 🔐 Security Features

- ✅ **Email validation:** Only `@amrita.edu` emails allowed
- ✅ **Password hashing:** Bcrypt with salt rounds
- ✅ **JWT tokens:** Secure session management
- ✅ **Role-based access:** Middleware enforces permissions
- ✅ **Input validation:** Server-side validation on all endpoints

---

## 🎓 Interest-Based Filtering Logic

**Backend (Critical Implementation):**

```javascript
// In eventController.js
exports.getEvents = async (req, res) => {
  let query = { status: 'approved' };
  
  // INTEREST-BASED FILTERING (NO AI)
  if (req.user.role === 'student') {
    query.category = { $in: req.user.interests };
  }
  
  const events = await Event.find(query).sort({ eventDate: 1 });
  res.json({ data: events });
};
```

**Frontend Display:**
- Student dashboard shows: "Showing events matching your interests: Hackathons, Tech Workshops"
- Additional filters: date, department, online/offline

---

## 🚀 Deployment Guide

### 1. MongoDB Atlas
1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist IP: `0.0.0.0/0` (all IPs)
3. Copy connection string to `MONGODB_URI`

### 2. Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get API credentials from dashboard
3. Add to backend `.env`

### 3. Backend (Render/Railway)
```bash
# Push to GitHub
git push origin main

# On Render: New Web Service
# Connect GitHub repo
# Build Command: npm install
# Start Command: npm start
# Add environment variables from .env
```

### 4. Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Add environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL=<your-backend-url>
```

---

## 📊 User Flows

### Student Flow
1. Register with @amrita.edu email
2. Select interests (min 1 required)
3. View interest-based event feed
4. Click event → View details
5. Register for event → Opens registration link
6. Add to Google Calendar

### Club Organizer Flow
1. Register as club organizer
2. Create event with poster image
3. Wait for admin approval
4. Track views and registrations
5. Edit/delete events

### Admin Flow
1. Review pending events
2. Approve or reject with reason
3. Feature important events
4. Send campus-wide announcements
5. Monitor platform statistics

---

## 💡 Key Differentiators

1. **NO AI/ML**: Pure interest-based filtering using database queries
2. **@amrita.edu only**: Campus-exclusive platform
3. **Free tier compatible**: Runs on 100% free hosting
4. **Official branding**: Matches Amrita's visual identity
5. **Production-ready**: Complete authentication, moderation, analytics

---

## 📝 Future Enhancements (Post-MVP)

- Email notifications via Nodemailer
- Browser push notifications
- Event clash detection
- Multi-campus support (expand to other Amrita campuses)
- Event categories customization by admin
- Attendance tracking via QR codes

---

## 👥 Roles & Permissions

| Feature | Student | Club | Admin |
|---------|---------|------|-------|
| View events (filtered) | ✅ | ✅ | ✅ |
| Create events | ❌ | ✅ | ✅ |
| Edit own events | ❌ | ✅ | ✅ |
| Approve/reject events | ❌ | ❌ | ✅ |
| Feature events | ❌ | ❌ | ✅ |
| Send announcements | ❌ | ❌ | ✅ |
| View analytics | ❌ | Own events | All events |

---

## 📸 Screenshots

*Screenshots to be added after deployment*

---

## 🤝 Contributing

This is a university project for Amrita Vishwa Vidyapeetham, Bengaluru campus.

---

## 📄 License

Proprietary - Amrita Vishwa Vidyapeetham

---

## 📞 Contact

For queries, contact: Campus IT Team

---

**Built with ❤️ for Amrita Bengaluru students**
