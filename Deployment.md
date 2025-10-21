# 🚀 Deployment Guide

Complete guide for deploying the KeyLife Electronics BOM Consolidation Tool.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development Setup](#local-development-setup)
3. [Production Build](#production-build)
4. [Deployment Options](#deployment-options)
5. [Troubleshooting](#troubleshooting)
6. [Performance Optimization](#performance-optimization)

---

## ✅ Pre-Deployment Checklist

### Before You Deploy

- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file configured with API keys
- [ ] Logo files in place (`/public/src/img/`)
- [ ] Code tested in development mode
- [ ] All features working correctly
- [ ] No console errors
- [ ] Responsive design tested

### Files to Check

```bash
# Required files
✓ index.html
✓ vite.config.js
✓ server.js
✓ package.json
✓ .env (with your API key)

# Required directories
✓ src/
✓ public/
✓ node_modules/
```

---

## 💻 Local Development Setup

### Step 1: Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd bom-consolidation-tool

# Install dependencies
npm install

# Verify installation
npm list react vite express exceljs
```

### Step 2: Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env and add your Gemini API key
nano .env  # or use your preferred editor
```

Add to `.env`:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### Step 3: Start Development Server

```bash
# Start Vite dev server
npm run dev
```

Visit: `http://localhost:5173`

### Development Workflow

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Watch for changes
# (Vite has HMR built-in, changes auto-reload)
```

---

## 🏗️ Production Build

### Step 1: Build Assets

```bash
# Create optimized production build
npm run build
```

This creates a `dist/` directory with:
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Production-ready files

### Step 2: Test Production Build Locally

```bash
# Preview production build
npm run preview

# Or start the Express server
npm start
```

Visit: `http://localhost:3000`

### Step 3: Verify Build

```bash
# Check dist directory
ls -lh dist/

# Expected output:
# index.html
# assets/
#   ├── index-[hash].js
#   └── index-[hash].css
```

---

## 🌐 Deployment Options

### Option 1: Local Server (Recommended for Internal Use)

Best for: Internal R&D team access

```bash
# 1. Build the application
npm run build

# 2. Start production server
npm start

# 3. Access at http://localhost:3000
```

**Keep Running:**
```bash
# Option A: Use PM2 (Process Manager)
npm install -g pm2
pm2 start server.js --name "bom-tool"
pm2 save
pm2 startup

# Option B: Use systemd (Linux)
# Create /etc/systemd/system/bom-tool.service
```

**Systemd Service File:**
```ini
[Unit]
Description=KeyLife BOM Consolidation Tool
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/bom-consolidation-tool
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable bom-tool
sudo systemctl start bom-tool
sudo systemctl status bom-tool
```

---

### Option 2: Static Hosting (No AI Features)

Best for: Quick deployment without backend

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

**Configuration for Static Hosts:**

Create `vercel.json` or `netlify.toml`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

⚠️ **Note**: API calls must be handled client-side (CORS required)

---

### Option 3: Docker Deployment

Best for: Containerized environments

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
```

**Build and Run:**
```bash
# Build Docker image
docker build -t keylife-bom-tool .

# Run container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --name bom-tool \
  keylife-bom-tool

# View logs
docker logs -f bom-tool
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  bom-tool:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

---

### Option 4: Cloud Deployment

#### **AWS EC2**

```bash
# 1. SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# 2. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 3. Clone and setup
git clone <repository-url>
cd bom-consolidation-tool
npm install
npm run build

# 4. Start with PM2
npm install -g pm2
pm2 start server.js
pm2 save
```

#### **Google Cloud Run**

```bash
# 1. Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/bom-tool

# 2. Deploy
gcloud run deploy bom-tool \
  --image gcr.io/PROJECT_ID/bom-tool \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Build Fails**

```bash
# Error: Cannot find module
Solution: Reinstall dependencies
npm run reinstall
```

#### 2. **Blank Page After Deploy**

```bash
# Check base path in vite.config.js
export default defineConfig({
  base: './',  # Ensure relative paths
})
```

#### 3. **API Key Not Working**

```bash
# Verify environment variable
echo $VITE_GEMINI_API_KEY

# For Vite, must start with VITE_
# Update useGeminiAI.js:
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

#### 4. **Logo Not Displaying**

```bash
# Check file path
ls -l public/src/img/keylife-logo-white.png

# Update path in App.jsx if needed
src="/src/img/keylife-logo-white.png"
```

#### 5. **localStorage Not Persisting**

```bash
# Check browser console for errors
# Clear storage and retry
localStorage.clear()
```

#### 6. **Port Already in Use**

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or change port
PORT=3001 npm start
```

---

## ⚡ Performance Optimization

### 1. Asset Optimization

```bash
# Build with optimizations
npm run build

# Check bundle size
ls -lh dist/assets/

# Analyze bundle
npm install -D rollup-plugin-visualizer
```

### 2. Caching Strategy

Update `server.js`:
```javascript
app.use(express.static('dist', {
  maxAge: '1y',      // Cache for 1 year
  etag: true,
  lastModified: true
}));
```

### 3. Compression

```bash
# Install compression middleware
npm install compression

# Update server.js
const compression = require('compression');
app.use(compression());
```

### 4. Environment-Specific Builds

```bash
# Development build (faster, larger)
npm run dev

# Production build (slower, optimized)
npm run build
```

---

## 📊 Monitoring

### Health Check Endpoint

Test: `http://localhost:3000/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-21T...",
  "version": "0.1.0-beta"
}
```

### Logs

```bash
# View server logs
tail -f logs/app.log

# With PM2
pm2 logs bom-tool

# With Docker
docker logs -f bom-tool
```

---

## 🔐 Security Checklist

- [ ] API keys in `.env`, not in code
- [ ] `.env` in `.gitignore`
- [ ] HTTPS enabled (if public)
- [ ] CORS configured properly
- [ ] Dependencies updated
- [ ] No sensitive data in localStorage
- [ ] Error messages don't expose internals

---

## 📞 Support

For deployment issues:
1. Check this guide
2. Review error logs
3. Test in development first
4. Contact R&D team

---

**Last Updated**: October 2025  
**Author**: Amro K Saleh, KeyLife Electronics R&D