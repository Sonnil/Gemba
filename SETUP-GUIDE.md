# 🚀 FLEX-FORM Setup Guide

## Step-by-Step Setup for Secure Database with GitHub

### 1. Create Supabase Account (Free)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub (recommended)
4. Create a new project:
   - **Name**: `flex-form-database`
   - **Password**: (choose a strong password)
   - **Region**: Choose closest to your users

### 2. Get Database Credentials

In your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsI...` (starts with eyJ)
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsI...` (different, longer key)

### 3. Setup GitHub Repository

1. Fork or create the FLEX-FORM repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   - **Name**: `SUPABASE_URL`
   - **Value**: Your Project URL

   - **Name**: `SUPABASE_ANON_KEY` 
   - **Value**: Your anon/public key

   - **Name**: `SUPABASE_SERVICE_KEY`
   - **Value**: Your service_role key

### 4. Enable GitHub Pages

1. In your repository, go to **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `gh-pages` (will be created automatically)
4. Click **Save**

### 5. Initial Deployment

1. Make any small change to trigger deployment:
   ```bash
   git add .
   git commit -m "Initial secure deployment"
   git push origin main
   ```

2. Go to **Actions** tab to watch the deployment
3. Once complete, your app will be at: `https://yourusername.github.io/FLEX-FORM/`

### 6. First Time Use

1. Open your deployed app
2. In the "Secure Database Settings" section:
   - **Supabase URL**: Enter your project URL
   - **API Key**: Enter your anon/public key
   - **Table Name**: `gemba_requests` (or custom name)
   - **Your Email**: Your email for audit logging
   - **Department**: Your department name

3. Click **Connect to Database**
4. You should see: ✅ Secure connection established!

### 7. Test the Form

1. Use a template or build a custom form
2. Click **Submit to Secure Database**
3. Check your Supabase dashboard → **Table Editor** to see the data

---

## 🔧 Troubleshooting

### Connection Issues
- **URL format**: Must be `https://xxx.supabase.co`
- **API key**: Should start with `eyJ`
- **Row Level Security**: Check if RLS is enabled in Supabase

### GitHub Actions Failed
- Check if all three secrets are set correctly
- Ensure secret values don't have extra spaces
- Wait a few minutes and try again

### Data Not Saving
- Check browser console for errors
- Verify email field is filled (required for audit)
- Check Supabase logs in dashboard

---

## 🛡️ Security Verification

After setup, verify these security features are working:

1. **Encryption**: Check that sensitive fields are encrypted in database
2. **Audit Logging**: See audit_log column populated with user actions
3. **Department Isolation**: Users only see their department's data
4. **GitHub Security**: Secrets are encrypted and not visible in code

---

## 📞 Need Help?

- Check the detailed README-SECURE.md
- Review GitHub Actions logs for deployment issues
- Check Supabase dashboard logs for database errors
- Verify all steps were completed correctly

**🎉 Once setup is complete, you'll have a secure, enterprise-grade form system that can handle 7000+ records with full audit trails and encryption!**
