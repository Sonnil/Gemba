/**
 * SharePoint Integration Module for FLEX-FORM
 * Handles connection, list creation, and data submission to SharePoint Lists
 */

class SharePointConnector {
    constructor(config = {}) {
        this.config = {
            apiVersion: config.apiVersion || 'v1.0',
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            ...config
        };
        
        this.connection = {
            siteUrl: '',
            token: '',
            connected: false,
            lastPing: null,
            siteId: ''
        };
        
        this.listCache = new Map();
    }

    /**
     * Establish connection to SharePoint
     * @param {string} siteUrl - SharePoint site URL
     * @param {string} token - Authentication token (optional, for demo purposes)
     */
    async connect(siteUrl, token = '') {
        try {
            // Validate URL format
            if (!this.isValidSharePointUrl(siteUrl)) {
                throw new Error('Invalid SharePoint site URL format');
            }

            this.connection.siteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
            this.connection.token = token;

            // Test connection (in real implementation, this would make an actual API call)
            const testResult = await this.testConnection();
            
            if (testResult.success) {
                this.connection.connected = true;
                this.connection.lastPing = new Date();
                this.connection.siteId = testResult.siteId;
                return { success: true, message: 'Connected to SharePoint successfully' };
            } else {
                throw new Error(testResult.error);
            }
        } catch (error) {
            this.connection.connected = false;
            return { success: false, error: error.message };
        }
    }

    /**
     * Test SharePoint connection
     */
    async testConnection() {
        try {
            // Simulate API call to test connection
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // In real implementation, make actual API call to SharePoint:
            // const response = await fetch(`${this.connection.siteUrl}/_api/web`, {
            //     headers: this.getHeaders()
            // });
            
            return { 
                success: true,
                siteId: 'demo-site-id-12345' // In real implementation, get from API
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate SharePoint site URL format
     */
    isValidSharePointUrl(url) {
        try {
            const urlObj = new URL(url);
            // Basic validation for SharePoint URL pattern
            return urlObj.protocol === 'https:' && 
                   (urlObj.hostname.includes('.sharepoint.com') || 
                    urlObj.hostname.includes('.sharepoint-df.com') ||
                    urlObj.hostname.includes('localhost') || // For development
                    urlObj.hostname.includes('127.0.0.1')); // For development
        } catch {
            return false;
        }
    }

    /**
     * Get authentication headers for SharePoint API
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.connection.token) {
            headers['Authorization'] = `Bearer ${this.connection.token}`;
        }

        return headers;
    }

    /**
     * Create SharePoint list based on form fields
     * @param {string} listName - Name of the SharePoint list
     * @param {Array} fields - Form fields configuration
     */
    async createList(listName, fields) {
        if (!this.connection.connected) {
            throw new Error('Not connected to SharePoint');
        }

        try {
            const listSchema = this.generateListSchema(listName, fields);
            
            // Simulate API call (in real implementation, use SharePoint REST API or Graph API)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // In real implementation:
            // const response = await fetch(`${this.connection.siteUrl}/_api/web/lists`, {
            //     method: 'POST',
            //     headers: this.getHeaders(),
            //     body: JSON.stringify(listSchema)
            // });

            return {
                success: true,
                listName: listName,
                listId: `list_${listName.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
                message: `SharePoint list '${listName}' created successfully`,
                schema: listSchema
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to create SharePoint list: ${error.message}`
            };
        }
    }

    /**
     * Generate SharePoint list schema
     */
    generateListSchema(listName, fields) {
        const columns = fields.map(field => this.mapFieldToColumn(field));
        
        return {
            Title: listName,
            Description: `Auto-generated list for ${listName} form`,
            BaseTemplate: 100, // Generic List template
            Columns: columns
        };
    }

    /**
     * Map form field to SharePoint column
     */
    mapFieldToColumn(field) {
        const column = {
            Name: field.name || `field_${field.id}`,
            Title: field.label || field.name || `Field ${field.id}`,
            FieldType: this.mapFieldTypeToSP(field.type),
            Required: field.required || false,
            Description: field.description || ''
        };

        // Add specific configurations based on field type
        switch (field.type) {
            case 'text':
            case 'email':
                column.MaxLength = field.maxLength || 255;
                break;
            case 'number':
                column.MinValue = field.min || null;
                column.MaxValue = field.max || null;
                break;
            case 'select':
            case 'radio':
                if (field.options) {
                    column.Choices = field.options;
                    column.FieldType = 'Choice';
                }
                break;
            case 'textarea':
                column.RichText = false;
                column.NumberOfLines = 6;
                break;
        }

        return column;
    }

    /**
     * Map field type to SharePoint field type
     */
    mapFieldTypeToSP(fieldType) {
        const typeMap = {
            'text': 'Text',
            'email': 'Text',
            'number': 'Number',
            'date': 'DateTime',
            'select': 'Choice',
            'radio': 'Choice',
            'checkbox': 'Boolean',
            'textarea': 'Note',
            'file': 'File'
        };
        
        return typeMap[fieldType] || 'Text';
    }

    /**
     * Create choice options for SharePoint fields
     */
    createChoiceOptions(options) {
        return options.map(option => option.toString());
    }

    /**
     * Format list display name
     */
    formatListDisplayName(listName) {
        return listName.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Format column internal name for SharePoint
     */
    formatColumnName(name) {
        return name.split('_')
            .map((word, index) => 
                index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join('');
    }

    /**
     * Get primary title field from fields for SharePoint
     */
    getPrimaryTitleField(fields) {
        // Look for a text field that could serve as title
        const titleFields = fields.filter(field => 
            field.type === 'text' && 
            (field.name.toLowerCase().includes('title') || 
             field.name.toLowerCase().includes('name'))
        );
        
        return titleFields.length > 0 ? titleFields[0].name : fields[0]?.name || 'Title';
    }

    /**
     * Submit form data to SharePoint list
     * @param {string} listName - Target SharePoint list name
     * @param {Object} formData - Form data to submit
     */
    async submitData(listName, formData) {
        if (!this.connection.connected) {
            throw new Error('Not connected to SharePoint');
        }

        try {
            const processedData = this.processFormData(formData);
            
            // In real implementation, submit data via SharePoint REST API or Graph API
            // const response = await fetch(`${this.connection.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`, {
            //     method: 'POST',
            //     headers: this.getHeaders(),
            //     body: JSON.stringify(processedData)
            // });

            // Simulate data submission
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            return {
                success: true,
                itemId: this.generateId(),
                listName: listName,
                data: processedData
            };
        } catch (error) {
            throw new Error(`Failed to submit data to SharePoint: ${error.message}`);
        }
    }

    /**
     * Process form data for SharePoint list submission
     */
    processFormData(formData) {
        const processed = {};
        
        Object.entries(formData).forEach(([key, value]) => {
            // Handle different data types
            if (Array.isArray(value)) {
                // Multiple values (checkboxes)
                processed[key] = value.join(';');
            } else if (value instanceof File) {
                // File handling would require additional processing
                processed[key] = value.name;
            } else {
                processed[key] = value;
            }
        });
        
        return processed;
    }

    /**
     * Generate ID for new SharePoint list items
     */
    generateId() {
        return Math.floor(Math.random() * 1000000) + 1;
    }

    /**
     * Get SharePoint list metadata
     * @param {string} listName - SharePoint list name
     */
    async getListMetadata(listName) {
        if (!this.connection.connected) {
            throw new Error('Not connected to SharePoint');
        }

        try {
            // Check cache first
            if (this.listCache.has(listName)) {
                return this.listCache.get(listName);
            }

            // In real implementation, fetch metadata via SharePoint API
            // const response = await fetch(`${this.connection.siteUrl}/_api/web/lists/getbytitle('${listName}')`, {
            //     headers: this.getHeaders()
            // });

            // Simulate metadata retrieval
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const metadata = {
                Title: listName,
                DisplayName: this.formatListDisplayName(listName),
                columns: []
            };

            this.listCache.set(listName, metadata);
            return metadata;
        } catch (error) {
            throw new Error(`Failed to get SharePoint list metadata: ${error.message}`);
        }
    }

    /**
     * Disconnect from SharePoint
     */
    disconnect() {
        this.connection = {
            siteUrl: '',
            token: '',
            siteId: '',
            connected: false,
            lastPing: null
        };
        this.listCache.clear();
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.connection.connected,
            siteUrl: this.connection.siteUrl,
            siteId: this.connection.siteId,
            lastPing: this.connection.lastPing
        };
    }

    /**
     * Validate SharePoint list name
     */
    isValidListName(listName) {
        // SharePoint list names should not contain certain characters
        const invalidChars = /[\/\\:*?"<>|#{}%~&]/;
        return !invalidChars.test(listName) && listName.length <= 255 && listName.trim().length > 0;
    }

    /**
     * Generate form HTML with SharePoint integration
     * @param {Object} formConfig - Form configuration
     */
    generateIntegratedForm(formConfig) {
        const { title, description, fields, listName } = formConfig;
        
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        .form-container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
        input, select, textarea { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; }
        input:focus, select:focus, textarea:focus { border-color: #667eea; outline: none; }
        button { background: #667eea; color: white; padding: 15px 30px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; width: 100%; }
        button:hover { background: #5a6fd8; }
        .required { color: red; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .loading { opacity: 0.6; pointer-events: none; }
    </style>
</head>
<body>
    <div class="form-container">
        <h1>${title}</h1>
        ${description ? `<p style="color: #666; margin-bottom: 30px;">${description}</p>` : ''}
        
        <div id="message"></div>
        
        <form id="sharepointForm">
`;

        fields.forEach(field => {
            html += this.generateFieldHTML(field);
        });

        html += `
            <button type="submit" id="submitBtn">Submit Form</button>
        </form>
    </div>

    <script>
        const DATAVERSE_CONFIG = {
            url: '${this.connection.url}',
            entityName: '${entityName}',
            apiVersion: '${this.config.apiVersion}'
        };

        document.getElementById('sharepointForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            
            // Show loading state
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            this.classList.add('loading');
            messageDiv.innerHTML = '';
            
            try {
                // Collect form data
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());
                
                // Submit to SharePoint (simulated)
                await submitToSharePoint(data);
                
                // Show success message
                messageDiv.innerHTML = '<div class="success">Form submitted successfully to SharePoint!</div>';
                this.reset();
                
            } catch (error) {
                // Show error message
                messageDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
            } finally {
                // Reset button state
                submitBtn.textContent = 'Submit Form';
                submitBtn.disabled = false;
                this.classList.remove('loading');
            }
        });
        
        async function submitToSharePoint(data) {
            // Simulate API call
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (Math.random() > 0.1) { // 90% success rate
                        resolve({ id: Math.floor(Math.random() * 1000000), data: data });
                    } else {
                        reject(new Error('SharePoint connection error occurred'));
                    }
                }, 2000);
            });
        }
    </script>
</body>
</html>`;

        return html;
    }

    /**
     * Generate HTML for individual field
     */
    generateFieldHTML(field) {
        const requiredAttr = field.required ? 'required' : '';
        const requiredLabel = field.required ? ' <span class="required">*</span>' : '';

        let html = `<div class="form-group">
            <label for="${field.name}">${field.label}${requiredLabel}</label>`;

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
                html += `<input type="${field.type}" id="${field.name}" name="${field.name}" placeholder="${field.placeholder}" ${requiredAttr}>`;
                break;
            
            case 'textarea':
                html += `<textarea id="${field.name}" name="${field.name}" placeholder="${field.placeholder}" rows="4" ${requiredAttr}></textarea>`;
                break;
            
            case 'select':
                const selectOptions = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                html += `<select id="${field.name}" name="${field.name}" ${requiredAttr}>
                    <option value="">Choose an option...</option>
                    ${selectOptions}
                </select>`;
                break;
            
            case 'radio':
                html += '<div>';
                field.options.forEach((opt, index) => {
                    html += `<label style="display: inline-block; margin-right: 20px; font-weight: normal;">
                        <input type="radio" name="${field.name}" value="${opt}" ${requiredAttr} style="width: auto; margin-right: 5px;">
                        ${opt}
                    </label>`;
                });
                html += '</div>';
                break;
            
            case 'checkbox':
                if (field.options.length > 0) {
                    html += '<div>';
                    field.options.forEach((opt, index) => {
                        html += `<label style="display: block; margin-bottom: 5px; font-weight: normal;">
                            <input type="checkbox" name="${field.name}[]" value="${opt}" style="width: auto; margin-right: 5px;">
                            ${opt}
                        </label>`;
                    });
                    html += '</div>';
                } else {
                    html += `<label style="font-weight: normal;">
                        <input type="checkbox" name="${field.name}" value="1" style="width: auto; margin-right: 5px;">
                        ${field.label}
                    </label>`;
                }
                break;
            
            case 'file':
                html += `<input type="file" id="${field.name}" name="${field.name}" ${requiredAttr}>`;
                break;
        }

        html += '</div>';
        return html;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataverseConnector;
} else if (typeof window !== 'undefined') {
    window.DataverseConnector = DataverseConnector;
}
