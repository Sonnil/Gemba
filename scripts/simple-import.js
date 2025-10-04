#!/usr/bin/env node
/**
 * Simplified Data Import for FLEX-FORM
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

async function importData() {
    console.log('🚀 Starting Gemba Data Import...');
    
    // Create Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        { auth: { persistSession: false } }
    );

    // Test connection first
    console.log('🔗 Testing database connection...');
    try {
        const { data, error } = await supabase.rpc('version');
        if (error) throw error;
        console.log('✅ Database connected successfully!');
    } catch (err) {
        console.log('❌ Connection failed:', err.message);
        return;
    }

    // Create table if it doesn't exist
    console.log('📋 Creating gemba_requests table...');
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS gemba_requests (
            id SERIAL PRIMARY KEY,
            request_id TEXT,
            short_description TEXT,
            contact_organizer TEXT,
            location TEXT,
            event_occurred TEXT,
            event_detected TEXT,
            expected_results TEXT,
            process_effectiveness TEXT,
            outcome TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        if (error) console.log('Table might already exist:', error.message);
        else console.log('✅ Table created successfully!');
    } catch (err) {
        console.log('⚠️ Table creation warning:', err.message);
    }

    // Import CSV data
    console.log('📁 Reading CSV file...');
    const records = [];
    
    return new Promise((resolve, reject) => {
        fs.createReadStream('Gemba Requests.csv')
            .pipe(csv())
            .on('data', (data) => {
                records.push({
                    request_id: data.ID,
                    short_description: data['Short Description'],
                    contact_organizer: data['Contact / Organizer'],
                    location: data['Where (building/room #/lab)?'],
                    event_occurred: data['When did the event occur?'],
                    event_detected: data['When was the event detected?'],
                    expected_results: data['Expected Results'],
                    process_effectiveness: data['Based on process conf., Gemba 100% effective'],
                    outcome: data['Outcome of Gemba']
                });
            })
            .on('end', async () => {
                console.log(`📊 Parsed ${records.length} records from CSV`);
                
                // Insert in batches
                console.log('⬆️ Importing to database...');
                const batchSize = 50;
                let imported = 0;
                
                for (let i = 0; i < records.length; i += batchSize) {
                    const batch = records.slice(i, i + batchSize);
                    
                    try {
                        const { data, error } = await supabase
                            .from('gemba_requests')
                            .insert(batch);
                        
                        if (error) {
                            console.log(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
                        } else {
                            imported += batch.length;
                            console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}: ${imported}/${records.length} records`);
                        }
                    } catch (err) {
                        console.log(`❌ Batch error:`, err.message);
                    }
                }
                
                console.log(`🎉 Import completed! ${imported} records imported.`);
                resolve();
            })
            .on('error', reject);
    });
}

importData().catch(console.error);
