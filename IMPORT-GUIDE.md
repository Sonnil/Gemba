# Data Import Guide - FLEX-FORM Secure System

## Overview
This guide walks you through importing your existing Gemba Requests.xlsx data (6221 records) into the secure FLEX-FORM database with enterprise-grade security features.

## 🔐 Security Features Applied During Import

- **Email Encryption**: All email addresses encrypted with AES-256-GCM
- **Data Integrity**: SHA-256 hashes generated for all records
- **Classification**: Automatic data sensitivity classification
- **Department Isolation**: Records tagged by department for RLS
- **Audit Trail**: Complete import activity logging
- **Batch Processing**: Safe batch uploads with error handling

## 🚀 Quick Start

### Prerequisites
1. Supabase account with database setup
2. Node.js 16+ installed
3. Gemba Requests.csv file in project root

### Environment Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   Create `.env` file with your Supabase credentials:
   ```bash
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   
   # Import Configuration
   IMPORT_BATCH_SIZE=100
   IMPORT_DRY_RUN=false
   ```

3. **Verify CSV File**
   Ensure `Gemba Requests.csv` is in the project root directory.

### 📊 Data Import Process

#### Step 1: Run the Import Script
```bash
npm run import-data
```

#### Step 2: Monitor Progress
The script will show real-time progress:
```
🚀 Initializing Secure Data Importer...
📊 Database: https://your-project.supabase.co
⚙️ Batch size: 100 records
🔐 Security: Enterprise-grade encryption enabled
✅ Database connection successful
📝 Ensuring gemba_requests table exists...
✅ Secure table structure prepared
🛡️ Row Level Security enabled
📊 Performance indexes created
🔐 Encryption fields configured
📖 Reading CSV file: Gemba Requests.csv
📊 Processed 1000 records...
📊 Processed 2000 records...
...
✅ CSV parsing complete: 6220 records
🔐 Processing 6220 records with security features...
📦 Processing batch 1/63
📤 Uploading 6220 records to secure database...
  📊 Uploading batch 1/125...
  ✅ Uploaded 500/6220 records
  ✅ Uploaded 1000/6220 records
  ...
```

#### Step 3: Review Import Report
```
📋 IMPORT COMPLETE - SECURITY REPORT
==================================================
📊 Total Records: 6220
✅ Successfully Processed: 6220
📤 Successfully Uploaded: 6220
🔐 Encrypted Fields: 4127
⚠️ Warnings: 0
❌ Errors: 0
==================================================

🛡️ SECURITY FEATURES APPLIED:
  ✅ Email addresses encrypted with AES-256
  ✅ Data integrity hashes generated
  ✅ Records classified by sensitivity level
  ✅ Department-based data isolation
  ✅ Complete audit trail created
  ✅ Row Level Security policies enforced

📈 SUCCESS RATE: 100.00%

🎉 Your Gemba data is now securely stored with enterprise-grade protection!
```

## 📈 Data Mapping

### Original CSV Columns → Database Fields

| CSV Column | Database Field | Security Level | Notes |
|------------|----------------|----------------|-------|
| ID | original_id | Internal | Original ID preserved |
| Short Description | short_description | Internal | Searchable description |
| Contact / Organizer | contact_organizer_encrypted | **ENCRYPTED** | Email addresses encrypted |
| Where (building/room #/lab)? | location | Internal | Used for department classification |
| When did the event occur? | event_occurred | Internal | Date parsing applied |
| When was the event detected? | event_detected | Internal | Date parsing applied |
| Expected Results | expected_results | Internal | Process outcomes |
| Based on process conf., Gemba 100% effective | process_confidence | Internal | Effectiveness rating |
| Outcome of Gemba | gemba_outcome | Internal | Final results |

### Additional Security Fields Added

| Field | Purpose | Security Level |
|-------|---------|----------------|
| contact_organizer_hash | Email lookup without decryption | Internal |
| data_hash | Record integrity verification | Internal |
| security_classification | Data sensitivity level | Internal |
| department | RLS isolation | Internal |
| audit_log | Complete activity trail | Internal |
| import_batch | Batch tracking ID | Internal |

## 🏢 Department Classification

Records are automatically classified by department based on location:

- **NYA**: Records with "NYA" in location
- **FORBES**: Records with "FORBES" in location  
- **QC**: Records with "QC" in location
- **MICROBIOLOGY**: Records with "MICRO" in location
- **GENERAL**: All other records

## 🛡️ Security Classifications

Data is automatically classified:

- **INTERNAL**: Contains PII (email addresses)
- **CONFIDENTIAL**: Contains sensitive keywords
- **INTERNAL**: Default classification

## 🔧 Advanced Configuration

### Batch Size Optimization
```bash
# For faster imports (higher memory usage)
export IMPORT_BATCH_SIZE=200

# For slower imports (lower memory usage)
export IMPORT_BATCH_SIZE=50
```

### Dry Run Mode
```bash
# Test the import without writing to database
export IMPORT_DRY_RUN=true
npm run import-data
```

### Error Recovery
If import fails, records are processed in batches. Failed batches can be retried:

```bash
# Check logs for failed batch IDs
grep "batch failed" import-log.txt

# Resume from specific batch (if implemented)
export IMPORT_RESUME_BATCH=batch_1735234567890
npm run import-data
```

## 📊 Database Schema Created

```sql
-- Secure Gemba Requests table
CREATE TABLE gemba_requests (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'data-import@system',
    department TEXT NOT NULL DEFAULT 'general',
    security_classification TEXT DEFAULT 'internal',
    data_hash TEXT,
    audit_log JSONB DEFAULT '[]'::jsonb,
    
    -- Original data fields
    original_id TEXT,
    short_description TEXT NOT NULL,
    contact_organizer_encrypted TEXT,
    contact_organizer_hash TEXT,
    location TEXT,
    event_occurred DATE,
    event_detected DATE,
    expected_results TEXT,
    process_confidence TEXT,
    gemba_outcome TEXT,
    
    -- Import metadata
    import_batch TEXT,
    source_file TEXT DEFAULT 'Gemba Requests.csv',
    import_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security enabled
ALTER TABLE gemba_requests ENABLE ROW LEVEL SECURITY;

-- Performance indexes
CREATE INDEX idx_gemba_created_at ON gemba_requests (created_at);
CREATE INDEX idx_gemba_department ON gemba_requests (department);
CREATE INDEX idx_gemba_original_id ON gemba_requests (original_id);
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
   - Check Supabase project is active
   - Ensure service key has database access

2. **CSV File Not Found**
   - Ensure `Gemba Requests.csv` is in project root
   - Check file name matches exactly (case-sensitive)

3. **Memory Issues with Large Dataset**
   - Reduce IMPORT_BATCH_SIZE
   - Increase Node.js memory: `node --max-old-space-size=4096 scripts/import-data.js`

4. **Date Parsing Warnings**
   - Non-standard date formats become null
   - Check original data for date consistency

### Verification Steps

1. **Check Import Success**
   ```sql
   -- In Supabase SQL Editor
   SELECT COUNT(*) FROM gemba_requests;
   SELECT department, COUNT(*) FROM gemba_requests GROUP BY department;
   ```

2. **Verify Encryption**
   ```sql
   -- Check encrypted fields exist
   SELECT COUNT(*) FROM gemba_requests WHERE contact_organizer_encrypted IS NOT NULL;
   ```

3. **Test RLS Policies**
   ```sql
   -- Test department isolation
   SELECT * FROM gemba_requests WHERE department = 'NYA' LIMIT 5;
   ```

## 🎯 Next Steps After Import

1. **Verify Data in Supabase Dashboard**
   - Check record count matches expected (6220)
   - Verify data types and indexes
   - Test RLS policies

2. **Configure User Access**
   - Set up department-based user roles
   - Test form submissions with existing data
   - Configure user authentication

3. **Set Up Monitoring**
   - Enable audit log monitoring
   - Set up backup schedules
   - Configure alerting for data changes

4. **Test Form Integration**
   - Test new form submissions
   - Verify data consistency
   - Test search and filtering

## 📞 Support

If you encounter issues during import:

1. Check the console output for specific error messages
2. Verify your environment variables are set correctly
3. Ensure your Supabase project has sufficient resources
4. Check that RLS policies allow data insertion

Remember: Your data is now protected with enterprise-grade security including encryption, audit trails, and row-level security! 🛡️
