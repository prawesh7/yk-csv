# ✅ HostPapa Deployment Checklist

## Before Uploading

- [x] **Frontend built** (`npm run build` completed)
- [x] **Backend configured** for production
- [x] **Deployment scripts** created
- [ ] **Domain name** ready
- [ ] **HostPapa account** with Python support

## Files to Upload

Upload these to your HostPapa server:

```
📁 Your Project Folder/
├── 📁 build/              # React frontend (BUILD THIS FIRST)
├── 📁 backend/            # Python FastAPI backend
├── 📄 deploy.py           # Deployment script
├── 📄 start.sh            # Startup script
├── 📄 DEPLOYMENT.md       # Detailed instructions
└── 📄 HOSTPAPA_CHECKLIST.md
```

## Quick Setup Steps

1. **Upload files** to HostPapa via FTP/cPanel File Manager
2. **SSH into server** and navigate to project folder
3. **Run**: `./start.sh` or `python3 deploy.py`
4. **Configure domain** to point to `build/` folder for frontend
5. **Set up subdomain** (api.yourdomain.com) for backend
6. **Update URLs** in code with your actual domain

## Important URLs to Update

### In `backend/main.py` (line 39-40):
```python
"https://yourdomain.com",        # Replace with your domain
"https://www.yourdomain.com"     # Replace with your domain
```

### In `src/App.tsx` (line 5):
```typescript
const BACKEND_URL = "https://api.yourdomain.com";  // Replace with your API subdomain
```

## Testing After Deployment

1. **Frontend**: `https://yourdomain.com` - Should show the upload interface
2. **Backend API**: `https://api.yourdomain.com/docs` - Should show FastAPI docs
3. **OCR Test**: Upload an image and check if text extraction works

## Common HostPapa Settings

- **Document Root**: Point to your `build/` folder
- **Python Version**: 3.8+ recommended
- **SSL Certificate**: Enable for HTTPS
- **Cron Jobs**: Set up if you need scheduled tasks

## Need Help?

1. Check HostPapa documentation for Python hosting
2. Verify your domain DNS settings
3. Check server logs for errors
4. Test locally first before deploying

---
**Ready to deploy!** 🚀
