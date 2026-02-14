# 🎓 Beginner's Step-by-Step Setup Guide

Welcome! If you are new to coding, this guide will help you get **Amrita Pulse** running on your own computer. We will go from having nothing to a fully working app.

---

## 🛠️ Phase 1: Install Basic Tools
Before we start, you need these installed on your Windows computer:

1.  **Node.js:** Go to [nodejs.org](https://nodejs.org/), download the **LTS** version, and install it.
2.  **VS Code:** Download and install [Visual Studio Code](https://code.visualstudio.com/).
3.  **Git:** Download and install [Git for Windows](https://git-scm.com/).

---

## ☁️ Phase 2: Create Your Cloud Accounts (FREE)

### 1. MongoDB Atlas (Your Database)
This is where the app saves users and events.
1.  Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register).
2.  Create a free account.
3.  Click **Create a Cluster** and choose the **"Free"** option (Free forever!).
4.  Keep the defaults: **Name:** `Cluster0`, **Provider:** `AWS`, **Region:** `Mumbai (ap-south-1)`.
5.  Click **Create Cluster**. While it's building (takes 2-3 mins):
6.  In **Security > Database Access**, click "Add New Database User". Choose "Password" as the method. Give it a username and password (write them down!).
7.  In **Security > Network Access**, click "Add IP Address" and click **Allow Access From Anywhere**.
8.  Go back to **Database**, click **Connect**, then click **Drivers**. Copy the connection string. It looks like:
    `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
9.  **Pro Tip:** To give your database a name (instead of it being called "test"), add the name after the `.net/` part of the link. Example: `...mongodb.net/amrita-pulse?retryWrites...`

### 2. Cloudinary (For Event Posters)
This is where your images are stored.
1.  Go to [cloudinary.com](https://cloudinary.com/signup).
2.  Create a free account.
3.  On your Dashboard, you will see your **Cloud Name**, **API Key**, and **API Secret**. You will need these later.

---

## 📁 Phase 3: Project Setup on Your Computer

1.  Open **VS Code**.
2.  Open the `AmritaPulse` folder.
3.  You will see two main folders: `backend` and `frontend`.

---

## 🔑 Phase 4: The "Secret" Files (.env)
Apps use `.env` files to store keys securely. We need to create two of them.

### 1. Backend Config
1.  Inside the `backend` folder, create a new file and name it exactly `.env`
2.  Copy and paste this into it, replacing the parts in `< >` with your own info:
    ```env
    MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLUSTER.mongodb.net/amrita-pulse?retryWrites=true&w=majority
    JWT_SECRET=any_long_random_string_here
    JWT_EXPIRE=7d
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    PORT=5000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:3000
    ```

### 2. Frontend Config
1.  Inside the `frontend` folder, create a new file and name it exactly `.env.local`
2.  Copy and paste this:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5000
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=any_random_string_here
    ```

---

## 🚀 Phase 5: Start the App!

You need to run two commands in two different terminals inside VS Code.

### Step 1: Start the Backend (The Brain)
1.  In VS Code, go to **Terminal > New Terminal**.
2.  Type: `cd backend` then press Enter.
3.  Type: `npm install` then press Enter.
4.  Type: `npm run dev` then press Enter.
    *   *You should see: "🚀 Server running in development mode on port 5000"*

### Step 2: Start the Frontend (The Visuals)
1.  Open **another** new terminal (click the `+` icon in the terminal window).
2.  Type: `cd frontend` then press Enter.
3.  Type: `npm install` then press Enter.
4.  Type: `npm run dev` then press Enter.
    *   *You should see a link: http://localhost:3000*

---

## ✅ Finalizing
1.  Open your browser and go to `http://localhost:3000`.
2.  **Try to Register:** Use an email like `test@bl.students.amrita.edu`.
3.  If it works, congratulations! You have successfully set up Amrita Pulse.

### 💡 Pro Tip
If you ever get stuck, look at the terminal. If you see red text, read the error—it usually tells you exactly what is missing!
