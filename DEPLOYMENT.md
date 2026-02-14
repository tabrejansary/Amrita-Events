# Amrita Pulse - Deployment Checklist

## Pre-Deployment Setup

### 1. MongoDB Atlas Configuration
- [ ] Create free tier cluster at mongodb.com/cloud/atlas
- [ ] Create database user with password
- [ ] Whitelist all IPs: `0.0.0.0/0`
- [ ] Copy connection string
- [ ] Replace `<username>`, `<password>`, and database name

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/amrita-pulse?retryWrites=true&w=majority
```

### 2. Cloudinary Setup
- [ ] Sign up at cloudinary.com
- [ ] Navigate to Dashboard
- [ ] Copy: Cloud Name, API Key, API Secret
- [ ] Configure upload presets (optional)

### 3. Email Service (Optional for MVP)
- [ ] Create Gmail App Password
- [ ] Or use SendGrid/Mailgun free tier

---

## Backend Deployment (Render)

### Step 1: Prepare Repository
```bash
cd AmritaPulse
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name:** amrita-pulse-backend
   - **Environment:** Node
   - **Region:** Singapore (closest to India)
   - **Branch:** main
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### Step 3: Add Environment Variables
Add these in Render dashboard:
```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-random-32-char-string>
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
FRONTEND_URL=https://amrita-pulse.vercel.app
PORT=5000
NODE_ENV=production
```

### Step 4: Deploy
- Click "Create Web Service"
- Wait for deployment (~5 minutes)
- Copy deployment URL: `https://amrita-pulse-backend.onrender.com`

---

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Deploy
```bash
cd frontend
vercel
```

Follow prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name:** amrita-pulse
- **Directory:** ./
- **Override settings?** No

### Step 3: Add Environment Variables
In Vercel dashboard or via CLI:
```bash
vercel env add NEXT_PUBLIC_API_URL
# Paste: https://amrita-pulse-backend.onrender.com
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

Your app is live at: `https://amrita-pulse.vercel.app`

---

## Post-Deployment Testing

### 1. Create Admin Account
Use MongoDB Compass or Atlas UI:
```json
{
  "name": "Admin",
  "email": "admin@amrita.edu",
  "password": "$2a$10$..." // Hash "admin123" using bcrypt
  "role": "admin",
  "emailNotifications": true,
  "pushNotifications": true
}
```

Or use Postman to register and manually change role to "admin" in database.

### 2. Test User Flows

#### Student Flow
1. Go to production URL
2. Register with @amrita.edu email
3. Select interests (e.g., Hackathons, Tech Workshops)
4. Login and verify feed is empty (no events yet)

#### Club Flow
1. Register as club organizer
2. Create test event with category "Hackathons"
3. Upload test image
4. Verify status is "pending"

#### Admin Flow
1. Login as admin
2. Navigate to Pending Events
3. Approve the test event
4. Logout and login as student
5. Verify event appears in student feed (if interests match)

### 3. Verify Integrations
- [ ] Image upload to Cloudinary works
- [ ] "Add to Calendar" button generates correct Google Calendar link
- [ ] Registration tracking increments count
- [ ] Interest-based filtering works correctly

---

## Monitoring & Maintenance

### Render Free Tier Limitations
- App sleeps after 15 min of inactivity
- First request after sleep takes ~30 seconds (cold start)
- 750 hours/month free

**Solution:** Use cron job service (cron-job.org) to ping `/health` every 14 minutes to keep warm.

### Vercel Free Tier
- 100GB bandwidth/month
- Unlimited deployments
- Auto-scaling

### MongoDB Atlas Free Tier
- 512MB storage
- Shared cluster
- Monitor usage in Atlas dashboard

### Cloudinary Free Tier
- 25 monthly credits
- 25GB storage
- Monitor usage in Cloudinary dashboard

---

## Troubleshooting

### Backend Not Connecting to Database
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string format
- Check database user permissions

### CORS Errors
- Verify `FRONTEND_URL` in backend .env matches Vercel deployment URL
- Check CORS middleware in `server.js`

### Image Upload Failing
- Verify Cloudinary credentials
- Check file size (max 10MB recommended)
- Ensure `multer` middleware is configured

### Students Not Seeing Events
- Verify event status is "approved"
- Check event category matches student interests
- Confirm backend filtering logic

---

## Security Checklist (Production)

- [ ] Change default JWT_SECRET to strong random string
- [ ] Never commit .env files to Git
- [ ] Use production MongoDB cluster (not shared)
- [ ] Enable MongoDB Atlas encryption at rest
- [ ] Set up Cloudinary signed uploads (advanced)
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add helmet.js for security headers
- [ ] Enable HTTPS only (automatic on Vercel/Render)

---

## Future Scaling (Post-MVP)

### When to Upgrade
- MongoDB: When approaching 512MB limit
- Cloudinary: When approaching 25 credits/month
- Render: When cold starts become problematic

### Upgrade Path
1. **MongoDB:** $9/month for 10GB shared cluster
2. **Cloudinary:** $0.085/credit pay-as-you-go
3. **Render:** $7/month for always-on instance

---

## Backup Strategy

### Database Backups
```bash
# Manual backup using mongodump
mongodump --uri="<your-mongodb-uri>"
```

Or use MongoDB Atlas automated backups (paid tier).

### Code Backups
- [ ] Push to GitHub regularly
- [ ] Tag releases: `git tag v1.0.0`
- [ ] Keep deployment configurations in repo

---

## Demo Data Creation (Optional)

Create sample events for demonstration:

```bash
# Use Postman or frontend
# Login as club/admin
# Create events in different categories:
- Hackathon (Hackathons)
- AI Workshop (Tech Workshops)
- Coding Competition (Hackathons)
- Cultural Fest (Cultural Events)
- Sports Day (Sports)
```

This ensures students with different interests see relevant events.

---

## Deployment Complete ✅

Your Amrita Pulse platform is now live and production-ready!

**Next Steps:**
1. Announce to campus via official channels
2. Onboard club organizers
3. Monitor initial usage and gather feedback
4. Iterate based on user needs
