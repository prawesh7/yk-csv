# 🚀 YK-CSV Deployment Guide for HostPapa

## Prerequisites
- HostPapa hosting account with Python support
- SSH access to your server
- Domain name pointing to your HostPapa server

## Deployment Steps

### 1. Upload Files to HostPapa
```bash
# Upload these folders to your HostPapa server:
- build/          # React frontend (built files)
- backend/        # Python FastAPI backend
- deploy.py       # Deployment script
```

### 2. Set Up Backend on Server
```bash
# SSH into your HostPapa server
ssh your-username@your-domain.com

# Navigate to your project directory
cd /path/to/your/project

# Make deploy script executable
chmod +x deploy.py

# Run deployment script
python3 deploy.py
```

### 3. Configure Domain Settings

#### Update CORS in backend/main.py:
```python
allow_origins=[
    "http://localhost:3000",
    "https://yourdomain.com",        # Replace with your domain
    "https://www.yourdomain.com"     # Replace with your domain
],
```

#### Update BACKEND_URL in src/App.tsx:
```typescript
const BACKEND_URL = "https://yourdomain.com:8000";  // Replace with your domain
```

### 4. Set Up Web Server (Apache/Nginx)

#### For Apache (.htaccess):
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### For Nginx:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 5. Configure HostPapa

1. **Set Document Root** to your `build/` folder
2. **Enable Python** in your hosting control panel
3. **Set up subdomain** for API (e.g., `api.yourdomain.com` pointing to backend)
4. **Configure SSL** certificate for HTTPS

### 6. Environment Variables (if needed)

Create `.env` file on server:
```bash
# Backend environment
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend environment
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

## Testing Deployment

1. **Frontend**: Visit `https://yourdomain.com`
2. **Backend API**: Visit `https://api.yourdomain.com/docs`
3. **Test OCR**: Upload an image and check if text extraction works

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Update CORS origins in backend
2. **Python Dependencies**: Run `pip install -r requirements.txt`
3. **Tesseract OCR**: Install on server: `sudo apt-get install tesseract-ocr`
4. **Port Issues**: Ensure port 8000 is open and accessible

### Logs:
```bash
# Check backend logs
tail -f backend/logs/app.log

# Check server logs
tail -f /var/log/apache2/error.log
```

## Security Considerations

1. **Update CORS** to only allow your domain
2. **Use HTTPS** for all communications
3. **Set up firewall** rules
4. **Regular updates** of dependencies

## Maintenance

1. **Monitor logs** regularly
2. **Update dependencies** monthly
3. **Backup database** (if using one)
4. **Test OCR functionality** after updates

## Support

For issues with this deployment:
1. Check HostPapa documentation
2. Verify Python/PHP versions
3. Check server logs
4. Test locally first

---
**Note**: Replace `yourdomain.com` with your actual domain name throughout this guide.
