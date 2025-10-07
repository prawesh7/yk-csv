# 🚀 GitHub Deployment to HostPapa

## Method 1: Automatic Deployment with GitHub Actions

### Setup Steps:

1. **Create GitHub Repository**
   ```bash
   # In your project directory
   git init
   git add .
   git commit -m "Initial commit - YK-CSV ready for deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/yk-csv.git
   git push -u origin main
   ```

2. **Set up GitHub Secrets**
   Go to your GitHub repo → Settings → Secrets and variables → Actions
   Add these secrets:
   - `HOSTPAPA_HOST`: Your HostPapa server IP or domain
   - `HOSTPAPA_USERNAME`: Your HostPapa SSH username
   - `HOSTPAPA_SSH_KEY`: Your private SSH key
   - `PROJECT_PATH`: Path to your project on HostPapa (e.g., `/home/username/yk-csv`)

3. **Deploy Automatically**
   - Push to `main` branch
   - GitHub Actions will automatically deploy to HostPapa
   - Check Actions tab for deployment status

## Method 2: Manual SSH Deployment

### Setup on HostPapa:

1. **SSH into your HostPapa server**
   ```bash
   ssh your-username@your-domain.com
   ```

2. **Clone your repository**
   ```bash
   git clone https://github.com/yourusername/yk-csv.git
   cd yk-csv
   ```

3. **Run deployment script**
   ```bash
   ./deploy-to-hostpapa.sh
   ```

4. **Set up web server**
   - Point document root to `/path/to/yk-csv/build`
   - Configure subdomain for backend API

## Method 3: HostPapa Git Integration

### If HostPapa supports Git:

1. **Enable Git in HostPapa control panel**
2. **Add your GitHub repository URL**
3. **Set auto-deploy on push**
4. **Configure build commands**:
   ```bash
   npm install && npm run build
   cd backend && pip install -r requirements.txt
   ```

## Environment Configuration

### Update URLs for Production:

1. **In `backend/main.py`** (update CORS):
   ```python
   allow_origins=[
       "https://yourdomain.com",
       "https://www.yourdomain.com"
   ]
   ```

2. **In `src/App.tsx`** (update backend URL):
   ```typescript
   const BACKEND_URL = "https://api.yourdomain.com";
   ```

## Testing Deployment

1. **Frontend**: `https://yourdomain.com`
2. **Backend API**: `https://api.yourdomain.com/docs`
3. **GitHub Actions**: Check the Actions tab for deployment logs

## Advantages of GitHub Deployment

✅ **Version Control**: Track all changes
✅ **Automatic Deployment**: Push to deploy
✅ **Rollback Easy**: Revert to previous commits
✅ **Collaboration**: Multiple developers can work
✅ **CI/CD**: Automated testing and building
✅ **Backup**: Code is safely stored on GitHub

## Troubleshooting

### Common Issues:

1. **SSH Key Problems**: Make sure your SSH key is added to GitHub and HostPapa
2. **Permission Issues**: Ensure scripts are executable (`chmod +x`)
3. **Python Dependencies**: Install system dependencies on HostPapa
4. **Port Issues**: Ensure port 8000 is accessible

### Debug Commands:
```bash
# Check if backend is running
ps aux | grep python

# Check logs
tail -f backend/app.log

# Test API
curl https://api.yourdomain.com/health
```

---
**Choose the method that works best with your HostPapa setup!** 🚀
