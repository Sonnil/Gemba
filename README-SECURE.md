# 🔐 FLEX-FORM - Secure Enterprise Form Builder

A secure, flexible form builder with enterprise-grade database integration, encryption, and audit logging.

## 🚀 Features

### 📝 Form Building
- **Dynamic form creation** with intuitive drag-and-drop interface
- **Multiple field types**: text, email, number, date, select, checkbox, file upload, etc.
- **Template system** with pre-built forms including comprehensive Gemba workflow templates
- **Real-time preview** and responsive design
- **Export capabilities** (JSON, HTML, integrated forms)

### 🛡️ Enterprise Security
- **Client-side AES-256-GCM encryption** for sensitive data fields
- **Row Level Security (RLS)** with department-based access control
- **Complete audit logging** with user tracking and change history
- **Data classification system** (public, internal, confidential, restricted)
- **PII detection and automatic protection**
- **Secure authentication** with role-based permissions

### 📊 Database Integration
- **Supabase PostgreSQL** backend with enterprise features
- **Automatic table creation** with security policies
- **Data retention policies** and automated cleanup
- **Performance optimization** with proper indexing
- **Handles 7000+ records** efficiently

### 🔄 GitHub Integration
- **Automated deployments** via GitHub Actions
- **Secure secrets management** with GitHub repository secrets
- **CI/CD pipeline** with security scanning
- **Automatic database migrations**
- **Free hosting** on GitHub Pages

## 🏗️ Quick Setup

### 1. Repository Setup
```bash
git clone https://github.com/yourusername/FLEX-FORM.git
cd FLEX-FORM
npm install
```

### 2. Database Setup (Supabase)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and API keys from Settings → API
3. Run the database setup script:
```bash
SUPABASE_URL=your_url SUPABASE_SERVICE_KEY=your_key npm run setup-db
```

### 3. GitHub Secrets Configuration
In your repository Settings → Secrets and variables → Actions, add:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your public/anon API key  
- `SUPABASE_SERVICE_KEY`: Your service role key (for migrations)

### 4. Deploy
```bash
git add .
git commit -m "Deploy secure FLEX-FORM"
git push origin main
```

Your app will be available at: `https://yourusername.github.io/FLEX-FORM/`

## 🔧 Local Development

```bash
# Start local server
npm run dev

# Run security scan
npm run security-scan

# Setup database
npm run setup-db
```

## 📋 Usage

### 1. Connect to Database
- Enter your Supabase URL and API key
- Provide your email and department for audit logging
- Specify table name for your forms

### 2. Build Forms
- Use the intuitive form builder interface
- Add fields by clicking field type buttons
- Configure field properties (validation, encryption, etc.)
- Use templates for common workflows

### 3. Security Features
- Sensitive fields are automatically encrypted
- All actions are logged for audit purposes
- Department-based access control
- Data classification and compliance tracking

## 🛡️ Security Architecture

### Database Security
- **Row Level Security (RLS)**: Users only see their department's data
- **Encryption**: Sensitive fields encrypted with AES-256-GCM
- **Audit Logging**: Complete trail of all data access and changes
- **Data Classification**: Automatic PII detection and protection

### Access Control
- **Role-based permissions**: Admin, Manager, User, Viewer roles
- **Department isolation**: Users only access their department's data
- **Authentication required**: All operations require valid user authentication
- **Session management**: Secure token handling

### Infrastructure Security
- **GitHub Secrets**: Encrypted credential storage
- **HTTPS Only**: All communication encrypted in transit
- **CSP Headers**: Protection against XSS attacks
- **Security Scanning**: Automated vulnerability detection

## 📊 Database Schema

The application creates secure tables with enterprise features:

- **`gemba_requests`**: Gemba workflow forms with 7000+ record support
- **`dynamic_forms`**: Form definitions and metadata
- **`security_audit`**: Complete audit log of all activities
- **`user_profiles`**: User management and permissions

Each table includes:
- Row Level Security policies
- Audit triggers for change tracking
- Performance indexes
- Data retention policies

## 🎯 Templates

### Gemba Intake Form
Comprehensive 62-field form for process improvement workflows:
- Team information and SME attendees
- 5W analysis (Who, What, When, Where, Why)
- Problem description and impact assessment
- Action items and follow-up tracking
- Criticality assessment and outcomes

### Other Templates
- Contact forms with PII protection
- Survey forms with analytics
- Registration forms with validation
- Custom workflow forms

## 🔒 Compliance Features

- **GDPR Ready**: Data protection and user rights management
- **SOC 2 Compatible**: Security controls and audit trails
- **Data Retention**: Configurable cleanup policies
- **Export Controls**: User data download capabilities
- **Consent Management**: Optional consent tracking

## 📈 Performance

- **Optimized for large datasets** (7000+ records)
- **Efficient queries** with proper indexing
- **Client-side caching** for better performance
- **Automatic cleanup** of old data
- **Progressive loading** for large forms

## 🆘 Support & Troubleshooting

### Common Issues

**Connection Failed**
- Verify Supabase URL format: `https://xxx.supabase.co`
- Check API key permissions
- Ensure Row Level Security is properly configured

**Permission Denied**
- Verify user email is registered in user_profiles table
- Check department assignments
- Confirm role-based permissions

**Data Not Saving**
- Check network connectivity
- Verify table exists and has proper RLS policies
- Review browser console for encryption errors

### Security Best Practices

1. **Rotate API keys** regularly
2. **Monitor audit logs** for suspicious activity
3. **Configure data retention** policies
4. **Regular security scans** via GitHub Actions
5. **Department access reviews** quarterly

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run security tests
4. Submit a pull request

---

**🔐 Built with Enterprise Security in Mind**

*FLEX-FORM provides the security and scalability needed for enterprise form workflows while maintaining ease of use.*
