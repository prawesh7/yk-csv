# 🚀 FTP Deployment Guide for HostPapa

## Files to Upload via FTP

### **Frontend Files (Upload to public_html):**
Upload these files from the `build/` folder to your domain's public_html directory:

```
📁 public_html/
├── 📄 index.html
├── 📄 asset-manifest.json
└── 📁 static/
    ├── 📁 css/
    │   └── 📄 main.cadded61.css
    └── 📁 js/
        └── 📄 main.4809543a.js
```

### **Backend Files (Upload to public_html root):**
Upload the PHP backend file directly to public_html:

```
📁 public_html/
├── 📄 index.html
├── 📄 asset-manifest.json
├── 📄 backend-api.php
└── 📁 static/
    ├── 📁 css/
    │   └── 📄 main.cadded61.css
    └── 📁 js/
        └── 📄 main.4809543a.js
```

## Step-by-Step FTP Upload

### **Method 1: Using HostPapa File Manager**
1. **Log into HostPapa Control Panel**
2. **Go to File Manager**
3. **Navigate to public_html**
4. **Upload all files from build/ folder**
5. **Upload backend-api.php to the same public_html folder**

### **Method 2: Using FTP Client (FileZilla, etc.)**
1. **Connect to your HostPapa FTP**
   - Host: ftp.yourdomain.com or your server IP
   - Username: Your HostPapa username
   - Password: Your HostPapa password
   - Port: 21

2. **Navigate to public_html folder**
3. **Upload build/ contents**
4. **Upload backend-api.php to the same folder**

## After Upload - Configure

### **1. Update Frontend for PHP Backend**
The frontend needs to use the PHP backend instead of Python.

### **2. Test Your Site**
- **Frontend**: https://yourdomain.com
- **Backend API**: https://yourdomain.com/backend-api.php

### **3. SSL Certificate**
Enable SSL certificate in HostPapa control panel for HTTPS.

## Troubleshooting

### **Common Issues:**
1. **Files not showing** - Check file permissions (755 for folders, 644 for files)
2. **CSS/JS not loading** - Ensure static/ folder is uploaded correctly
3. **API not working** - Check PHP is enabled and file permissions

### **File Permissions:**
- **Folders**: 755
- **Files**: 644
- **PHP files**: 644

## Advantages of FTP Deployment

✅ **Simple** - Just upload files
✅ **Reliable** - No complex build processes
✅ **Fast** - Direct file transfer
✅ **No SSH needed** - Works with shared hosting
✅ **Easy rollback** - Just replace files

---
**Ready to upload!** 🚀
