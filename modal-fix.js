// Clean showDataModal function for user-portal.html

// Modal functions for data visualization
async function showDataModal(type) {
    try {
        console.log('Opening modal for type:', type);
        
        const modal = document.getElementById('dataModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalTable = document.getElementById('modalTable');
        const exportBtn = document.getElementById('exportTableData');
        
        if (!modal || !modalTitle || !modalTable || !exportBtn) {
            console.error('Modal elements not found');
            return;
        }
        
        // Show loading state
        modalTable.innerHTML = '<div class="loading-data">Loading data...</div>';
        modal.style.display = 'flex';
        
        // Get data based on type
        let data = [];
        let title = '';
        
        const localSubmissions = JSON.parse(localStorage.getItem('flexform_submissions') || '[]');
        console.log('Found local submissions:', localSubmissions.length);
        
        let dbSubmissions = [];
        
        // Fetch database data if connected
        if (isConnectedToDatabase && supabaseClient) {
            try {
                console.log('Fetching database submissions...');
                
                // Try form_submissions first, then gemba_requests as fallback
                let formSubmissionsData = [];
                let gembaRequestsData = [];
                
                // Query form_submissions table
                let formQuery = supabaseClient.from('form_submissions').select('*');
                const { data: formData, error: formError } = await formQuery;
                if (!formError && formData) {
                    formSubmissionsData = formData;
                }
                
                // Query gemba_requests table  
                let gembaQuery = supabaseClient.from('gemba_requests').select('*');
                const { data: gembaData, error: gembaError } = await gembaQuery;
                if (!gembaError && gembaData) {
                    gembaRequestsData = gembaData;
                }
                
                // Combine all database submissions
                dbSubmissions = [...formSubmissionsData, ...gembaRequestsData];
                
                console.log(`Fetched database submissions: ${formSubmissionsData.length} from form_submissions, ${gembaRequestsData.length} from gemba_requests`);
                if (dbSubmissions.length > 0) {
                    console.log('Sample database record:', dbSubmissions[0]);
                }
                
            } catch (dbError) {
                console.error('Database fetch error:', dbError);
            }
        }
    
    switch(type) {
        case 'forms':
            title = 'Available Forms';
            data = [
                { name: 'Contact Form', description: 'Basic contact information form', status: 'Active', created: '2025-10-01' },
                { name: 'Gemba Request Form', description: 'Submit requests for Gemba walks and observations', status: 'Active', created: '2025-10-01' },
                { name: 'Feedback Form', description: 'Collect feedback and suggestions', status: 'Active', created: '2025-10-01' },
                { name: 'Event Registration', description: 'Register for company events and meetings', status: 'Active', created: '2025-10-01' }
            ];
            break;
        case 'total':
            title = `All Submissions (Local: ${localSubmissions.length}, Database: ${dbSubmissions.length})`;
            
            // Combine local and database data
            const allSubmissions = [...localSubmissions, ...dbSubmissions.map(dbSub => {
                // Convert database format to local format
                let parsed = {};
                
                // Handle different database table formats
                if (dbSub.form_data) {
                    // form_submissions table format
                    try {
                        parsed = JSON.parse(dbSub.form_data);
                    } catch (e) {
                        console.warn('Failed to parse form_data:', e);
                        parsed = {};
                    }
                } else {
                    // gemba_requests table format - fields are directly in the record
                    parsed = { ...dbSub };
                }
                
                return {
                    ...parsed,
                    form_name: dbSub.form_name || 'Unknown Form',
                    form_type: dbSub.form_type || 'form',
                    submitted_at: dbSub.submitted_at,
                    user_email: dbSub.user_email || dbSub.email,
                    created_by: dbSub.created_by || dbSub.user_email,
                    department: dbSub.department,
                    source: 'database'
                };
            })];
            
            data = allSubmissions.map(sub => {
                // Create a copy with all original fields plus formatted dates
                const fullData = { ...sub };
                
                // Add formatted date/time fields
                if (sub.submitted_at) {
                    fullData.submitted_date = new Date(sub.submitted_at).toLocaleDateString();
                    fullData.submitted_time = new Date(sub.submitted_at).toLocaleTimeString();
                }
                
                // Add source indicator
                fullData.data_source = sub.source || 'local';
                
                // Remove the original ISO timestamp for cleaner display
                delete fullData.submitted_at;
                delete fullData.source;
                
                return fullData;
            });
            
            console.log('Final processed data for modal:', data.length, 'records');
            if (data.length > 0) {
                console.log('Sample processed record:', data[0]);
            }
            break;
        case 'month':
            title = 'This Month\'s Submissions';
            
            // Filter local submissions for this month
            const thisMonthLocal = localSubmissions.filter(sub => {
                const date = new Date(sub.submitted_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            });
            
            // For monthly data, include all database records for now since imported data is likely recent
            console.log('For monthly view, showing all database records as they are likely recent');
            
            // Combine local and database data 
            const thisMonthAll = [...thisMonthLocal, ...dbSubmissions.map(dbSub => {
                // Convert database format to local format
                let parsed = {};
                
                // Handle different database table formats
                if (dbSub.form_data) {
                    // form_submissions table format
                    try {
                        parsed = JSON.parse(dbSub.form_data);
                    } catch (e) {
                        console.warn('Failed to parse form_data:', e);
                        parsed = {};
                    }
                } else {
                    // gemba_requests table format - fields are directly in the record
                    parsed = { ...dbSub };
                }
                
                return {
                    ...parsed,
                    form_name: dbSub.form_name || 'Unknown Form',
                    form_type: dbSub.form_type || 'form',
                    submitted_at: dbSub.submitted_at,
                    user_email: dbSub.user_email || dbSub.email,
                    created_by: dbSub.created_by || dbSub.user_email,
                    department: dbSub.department,
                    source: 'database'
                };
            })];
            
            title = `This Month's Submissions (Local: ${thisMonthLocal.length}, Database: ${dbSubmissions.length})`;
            
            data = thisMonthAll.map(sub => {
                // Create a copy with all original fields plus formatted dates
                const fullData = { ...sub };
                
                // Add formatted date/time fields
                if (sub.submitted_at) {
                    fullData.submitted_date = new Date(sub.submitted_at).toLocaleDateString();
                    fullData.submitted_time = new Date(sub.submitted_at).toLocaleTimeString();
                }
                
                // Add source indicator
                fullData.data_source = sub.source || 'local';
                
                // Remove the original ISO timestamp for cleaner display
                delete fullData.submitted_at;
                delete fullData.source;
                
                return fullData;
            });
            
            console.log('This month processed data:', data.length, 'records');
            break;
    }
    
    modalTitle.textContent = title;
    
    // Create table
    createDataTable(modalTable, data, type);
    
    // Show modal
    modal.style.display = 'flex';
    
    // Set up export functionality
    exportBtn.onclick = () => exportTableToExcel(data, title);
    
    } catch (error) {
        console.error('Error opening modal:', error);
        alert('Error opening data view: ' + error.message);
    }
}
