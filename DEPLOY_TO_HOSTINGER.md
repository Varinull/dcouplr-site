# Hostinger Deployment Instructions for <dcouplr/>

This directory contains the self-contained static release for Hostinger hosting.

## How to Deploy to Hostinger in 2 Minutes:

### Method A: Hostinger File Manager (Quickest)
1. Log in to your Hostinger hPanel.
2. Navigate to **Websites** -> Select your domain -> Open **File Manager**.
3. Go into the `public_html` directory.
4. Upload `dcouplr-hostinger-site.zip` and click **Extract** directly into `public_html`.
5. Ensure `.htaccess`, `index.html`, and assets are at the root of `public_html`.

### Method B: Git Auto-Deployment
1. In Hostinger hPanel, go to **Advanced** -> **Git**.
2. Connect your repository branch and set the deployment directory to `public_html`.
3. Set your build action to export this bundle.

### Verification URLs:
- Homepage: `https://yourdomain.com/`
- Download Hub: `https://yourdomain.com/#download-hub`
- Linux/macOS Installer: `curl -fsSL https://yourdomain.com/install.sh | sh`
- Windows Installer: `irm https://yourdomain.com/install.ps1 | iex`
