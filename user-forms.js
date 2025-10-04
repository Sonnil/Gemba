/**
 * FLEX-FORM User Interface JavaScript
 * Handles form submission, data export, and user interactions
 */

class FlexFormUser {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.currentTemplate = null;
        this.templates = [];
        this.userData = [];
        this.isConnected = false;
        
        this.initializeEventListeners();
        this.loadSavedCredentials();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.closest('.nav-tab').id);
            });
        });

        // Database connection
        document.getElementById('connectUserDatabase').addEventListener('click', () => {
            this.connectToDatabase();
        });

        // Back to selection button
        document.getElementById('backToSelection').addEventListener('click', () => {
            this.showFormSelection();
        });

        // Form actions
        document.getElementById('saveDraft').addEventListener('click', () => {
            this.saveDraft();
        });

        document.getElementById('submitForm').addEventListener('click', () => {
            this.submitForm();
        });

        document.getElementById('clearUserForm').addEventListener('click', () => {
            this.clearForm();
        });

        // Export functionality
        document.getElementById('exportToPDF').addEventListener('click', () => {
            this.exportData('pdf');
        });

        document.getElementById('exportToExcel').addEventListener('click', () => {
            this.exportData('excel');
        });

        document.getElementById('exportToCSV').addEventListener('click', () => {
            this.exportData('csv');
        });

        // Modal handlers
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        document.getElementById('closeSuccess').addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
        });

        document.getElementById('closeError').addEventListener('click', () => {
            document.getElementById('errorModal').style.display = 'none';
        });

        // Set default dates for export
        this.setDefaultExportDates();
    }

    /**
     * Switch between tabs
     */
    switchTab(tabId) {
        // Remove active class from all tabs and sections
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

        // Add active class to clicked tab
        document.getElementById(tabId).classList.add('active');

        // Show corresponding section
        const sectionMap = {
            'dashboardTab': 'dashboardSection',
            'formsTab': 'formsSection'
        };

        const sectionId = sectionMap[tabId];
        if (sectionId) {
            document.getElementById(sectionId).classList.add('active');
        }

        // Handle specific tab logic
        if (tabId === 'dashboardTab' && this.isConnected) {
            this.refreshDashboard();
        } else if (tabId === 'formsTab') {
            this.showFormSelection();
        }
    }

    /**
     * Show form selection step
     */
    showFormSelection() {
        // Show form selection step, hide form filling step
        document.getElementById('formSelectionStep').classList.add('active');
        document.getElementById('formFillingStep').classList.remove('active');
        
        // Load and display available templates
        this.displayAvailableTemplates();
    }

    /**
     * Display available templates as cards
     */
    async displayAvailableTemplates() {
        const container = document.getElementById('templatesGrid');
        
        // Ensure templates are loaded
        if (!this.templates || this.templates.length === 0) {
            await this.loadTemplates();
        }

        if (this.templates.length === 0) {
            container.innerHTML = `
                <div class="empty-templates">
                    <i class="fas fa-clipboard"></i>
                    <h3>No Forms Available</h3>
                    <p>No form templates have been created yet. Please contact your administrator.</p>
                </div>
            `;
            return;
        }

        // Create template cards
        let templatesHTML = '';
        this.templates.forEach(template => {
            templatesHTML += `
                <div class="template-card card-modern" data-template-id="${template.id}">
                    <div class="template-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="template-info">
                        <h3>${template.name}</h3>
                        <p>${template.description}</p>
                    </div>
                    <div class="template-actions">
                        <button class="btn-modern btn-primary select-template-btn" data-template-id="${template.id}">
                            <i class="fas fa-edit"></i> Use This Form
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = templatesHTML;

        // Add click handlers to template cards
        document.querySelectorAll('.select-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.dataset.templateId;
                this.selectTemplate(templateId);
            });
        });
    }

    /**
     * Select a template and show the form
     */
    selectTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) {
            this.showError('Template not found');
            return;
        }

        this.currentTemplate = template;
        
        // Update form title
        document.getElementById('currentFormTitle').innerHTML = `<i class="fas fa-edit"></i> ${template.name}`;
        
        // Switch to form filling step
        document.getElementById('formSelectionStep').classList.remove('active');
        document.getElementById('formFillingStep').classList.add('active');
        
        // Render the template
        this.renderTemplate(template);
        document.getElementById('formActions').style.display = 'flex';
    }

    /**
     * Load saved credentials from localStorage
     */
    loadSavedCredentials() {
        const savedUrl = localStorage.getItem('flexform_user_url');
        const savedEmail = localStorage.getItem('flexform_user_email');
        const savedDepartment = localStorage.getItem('flexform_user_department');

        if (savedUrl) document.getElementById('userDatabaseUrl').value = savedUrl;
        if (savedEmail) document.getElementById('currentUserEmail').value = savedEmail;
        if (savedDepartment) document.getElementById('currentUserDepartment').value = savedDepartment;

        // Auto-connect if credentials are available
        if (savedUrl && savedEmail) {
            this.connectToDatabase();
        }
    }

    /**
     * Connect to Supabase database
     */
    async connectToDatabase() {
        const url = document.getElementById('userDatabaseUrl').value.trim();
        const key = document.getElementById('userDatabaseKey').value.trim();
        const email = document.getElementById('currentUserEmail').value.trim();
        const department = document.getElementById('currentUserDepartment').value.trim();

        if (!url || !key || !email) {
            this.showError('Please fill in all required fields (URL, API Key, and Email)');
            return;
        }

        this.showLoading('Connecting to database...');

        try {
            // Initialize Supabase client
            this.supabase = window.supabase.createClient(url, key);

            // Test connection
            const { data, error } = await this.supabase
                .from('gemba_requests')
                .select('count', { count: 'exact', head: true });

            if (error) {
                throw new Error(`Database connection failed: ${error.message}`);
            }

            // Set current user
            this.currentUser = {
                email: email,
                department: department || 'general'
            };

            this.isConnected = true;

            // Save credentials
            localStorage.setItem('flexform_user_url', url);
            localStorage.setItem('flexform_user_email', email);
            localStorage.setItem('flexform_user_department', department);

            // Update UI
            this.updateConnectionStatus('Connected successfully', 'success');
            await this.loadTemplates();
            await this.refreshDashboard();

            this.hideLoading();
            this.showSuccess('Connected to database successfully!');

        } catch (error) {
            console.error('Connection error:', error);
            this.hideLoading();
            this.updateConnectionStatus(`Connection failed: ${error.message}`, 'error');
            this.showError(`Failed to connect to database: ${error.message}`);
        }
    }

    /**
     * Load available templates
     */
    async loadTemplates() {
        try {
            // Get templates from localStorage (from admin panel)
            const savedTemplates = localStorage.getItem('flexform_templates');
            if (savedTemplates) {
                this.templates = JSON.parse(savedTemplates);
            } else {
                // Default templates if none saved
                this.templates = [
                    {
                        id: 'gemba-intake',
                        name: 'Gemba Intake Form',
                        description: 'Standard Gemba workflow intake form'
                    },
                    {
                        id: 'smartsheet-gemba',
                        name: 'Smartsheet Gemba Form',
                        description: 'Gemba form based on Smartsheet template'
                    },
                    {
                        id: 'basic-contact',
                        name: 'Basic Contact Form',
                        description: 'Simple contact information form'
                    },
                    {
                        id: 'feedback-form',
                        name: 'Feedback Form',
                        description: 'Customer feedback and suggestions'
                    }
                ];
                
                // Create default template configurations
                this.createDefaultTemplateConfigs();
            }

            // Populate template dropdown
            const select = document.getElementById('userTemplateSelect');
            select.innerHTML = '<option value="">Select a form template...</option>';
            
            this.templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.name;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading templates:', error);
            this.showError('Failed to load form templates');
        }
    }

    /**
     * Create default template configurations
     */
    createDefaultTemplateConfigs() {
        // Basic Contact Form
        const basicContactConfig = {
            formTitle: 'Basic Contact Form',
            fields: [
                {
                    id: 'firstName',
                    type: 'text',
                    label: 'First Name',
                    required: true,
                    placeholder: 'Enter your first name'
                },
                {
                    id: 'lastName',
                    type: 'text',
                    label: 'Last Name',
                    required: true,
                    placeholder: 'Enter your last name'
                },
                {
                    id: 'email',
                    type: 'email',
                    label: 'Email Address',
                    required: true,
                    placeholder: 'Enter your email'
                },
                {
                    id: 'phone',
                    type: 'text',
                    label: 'Phone Number',
                    required: false,
                    placeholder: 'Enter your phone number'
                },
                {
                    id: 'company',
                    type: 'text',
                    label: 'Company',
                    required: false,
                    placeholder: 'Enter your company name'
                },
                {
                    id: 'message',
                    type: 'textarea',
                    label: 'Message',
                    required: false,
                    placeholder: 'Enter your message'
                }
            ]
        };

        // Feedback Form
        const feedbackConfig = {
            formTitle: 'Customer Feedback Form',
            fields: [
                {
                    id: 'customerName',
                    type: 'text',
                    label: 'Customer Name',
                    required: true,
                    placeholder: 'Enter your name'
                },
                {
                    id: 'email',
                    type: 'email',
                    label: 'Email Address',
                    required: true,
                    placeholder: 'Enter your email'
                },
                {
                    id: 'rating',
                    type: 'select',
                    label: 'Overall Rating',
                    required: true,
                    options: ['5 - Excellent', '4 - Very Good', '3 - Good', '2 - Fair', '1 - Poor']
                },
                {
                    id: 'category',
                    type: 'select',
                    label: 'Feedback Category',
                    required: true,
                    options: ['Product Quality', 'Customer Service', 'Website Experience', 'Pricing', 'Other']
                },
                {
                    id: 'feedback',
                    type: 'textarea',
                    label: 'Your Feedback',
                    required: true,
                    placeholder: 'Please share your detailed feedback'
                },
                {
                    id: 'recommend',
                    type: 'radio',
                    label: 'Would you recommend us?',
                    required: true,
                    options: ['Yes', 'No', 'Maybe']
                }
            ]
        };

        // Gemba Intake Form
        const gembaIntakeConfig = {
            formTitle: 'Gemba Intake Form',
            fields: [
                {
                    id: 'requestDate',
                    type: 'date',
                    label: 'Request Date',
                    required: true
                },
                {
                    id: 'requestorName',
                    type: 'text',
                    label: 'Requestor Name',
                    required: true,
                    placeholder: 'Enter requestor name'
                },
                {
                    id: 'department',
                    type: 'select',
                    label: 'Department',
                    required: true,
                    options: ['Operations', 'Quality', 'Engineering', 'Manufacturing', 'Supply Chain', 'Other']
                },
                {
                    id: 'processArea',
                    type: 'text',
                    label: 'Process Area',
                    required: true,
                    placeholder: 'Enter process area'
                },
                {
                    id: 'problemDescription',
                    type: 'textarea',
                    label: 'Problem Description',
                    required: true,
                    placeholder: 'Describe the problem or opportunity'
                },
                {
                    id: 'priority',
                    type: 'select',
                    label: 'Priority Level',
                    required: true,
                    options: ['High', 'Medium', 'Low']
                },
                {
                    id: 'expectedOutcome',
                    type: 'textarea',
                    label: 'Expected Outcome',
                    required: false,
                    placeholder: 'What outcome do you expect?'
                }
            ]
        };

        // Save configurations to localStorage
        localStorage.setItem('flexform_template_basic-contact', JSON.stringify(basicContactConfig));
        localStorage.setItem('flexform_template_feedback-form', JSON.stringify(feedbackConfig));
        localStorage.setItem('flexform_template_gemba-intake', JSON.stringify(gembaIntakeConfig));
        
        // Also create a minimal smartsheet-gemba config
        localStorage.setItem('flexform_template_smartsheet-gemba', JSON.stringify(gembaIntakeConfig));
    }

    /**
     * Load selected template
     */
    loadSelectedTemplate() {
        const templateId = document.getElementById('userTemplateSelect').value;
        if (!templateId) {
            this.showError('Please select a template first');
            return;
        }

        const template = this.templates.find(t => t.id === templateId);
        if (!template) {
            this.showError('Template not found');
            return;
        }

        this.currentTemplate = template;
        this.renderTemplate(template);
        document.getElementById('formActions').style.display = 'flex';
    }

    /**
     * Render template form
     */
    renderTemplate(template) {
        const container = document.getElementById('userFormContainer');
        
        // Get template configuration from localStorage
        const templateConfig = localStorage.getItem(`flexform_template_${template.id}`);
        let fields = [];

        if (templateConfig) {
            try {
                const config = JSON.parse(templateConfig);
                fields = config.fields || [];
            } catch (error) {
                console.error('Error parsing template config:', error);
            }
        }

        // If no saved config, use default based on template ID
        if (fields.length === 0) {
            fields = this.getDefaultTemplateFields(template.id);
        }

        // Render form
        let formHTML = `
            <div class="dynamic-form">
                <div class="form-header">
                    <h3>${template.name}</h3>
                    <p>${template.description}</p>
                </div>
                <div class="form-fields">
        `;

        fields.forEach((field, index) => {
            formHTML += this.renderFormField(field, index);
        });

        formHTML += `
                </div>
            </div>
        `;

        container.innerHTML = formHTML;

        // Add field event listeners
        this.addFormFieldListeners();
    }

    /**
     * Get default fields for template
     */
    getDefaultTemplateFields(templateId) {
        const defaultFields = {
            'gemba-intake': [
                { type: 'text', name: 'short_description', label: 'Short Description', required: true },
                { type: 'email', name: 'contact_organizer', label: 'Contact / Organizer', required: true },
                { type: 'text', name: 'location', label: 'Where (building/room #/lab)?', required: true },
                { type: 'date', name: 'event_occurred', label: 'When did the event occur?', required: true },
                { type: 'date', name: 'event_detected', label: 'When was the event detected?', required: true },
                { type: 'textarea', name: 'expected_results', label: 'Expected Results', required: true },
                { type: 'select', name: 'process_confidence', label: 'Based on process conf., Gemba 100% effective', 
                  options: ['Yes', 'No', 'Partially', 'Unknown'], required: true },
                { type: 'textarea', name: 'gemba_outcome', label: 'Outcome of Gemba', required: true }
            ],
            'smartsheet-gemba': [
                { type: 'text', name: 'request_title', label: 'Request Title', required: true },
                { type: 'email', name: 'requester_email', label: 'Requester Email', required: true },
                { type: 'select', name: 'priority', label: 'Priority', 
                  options: ['High', 'Medium', 'Low'], required: true },
                { type: 'textarea', name: 'description', label: 'Description', required: true },
                { type: 'date', name: 'due_date', label: 'Due Date', required: false }
            ]
        };

        return defaultFields[templateId] || [];
    }

    /**
     * Render individual form field
     */
    renderFormField(field, index) {
        const fieldId = `field_${index}_${field.name}`;
        const requiredClass = field.required ? 'required' : '';
        const requiredAttr = field.required ? 'required' : '';

        let fieldHTML = `
            <div class="form-group">
                <label for="${fieldId}" class="${requiredClass}">${field.label}</label>
        `;

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
                fieldHTML += `<input type="${field.type}" id="${fieldId}" name="${field.name}" 
                             placeholder="${field.placeholder || ''}" ${requiredAttr}>`;
                break;

            case 'textarea':
                fieldHTML += `<textarea id="${fieldId}" name="${field.name}" 
                             placeholder="${field.placeholder || ''}" ${requiredAttr}></textarea>`;
                break;

            case 'select':
                fieldHTML += `<select id="${fieldId}" name="${field.name}" ${requiredAttr}>
                             <option value="">Select an option...</option>`;
                if (field.options) {
                    field.options.forEach(option => {
                        fieldHTML += `<option value="${option}">${option}</option>`;
                    });
                }
                fieldHTML += `</select>`;
                break;

            case 'radio':
                if (field.options) {
                    fieldHTML += `<div class="radio-group">`;
                    field.options.forEach((option, optIndex) => {
                        const optionId = `${fieldId}_${optIndex}`;
                        fieldHTML += `
                            <div class="radio-option">
                                <input type="radio" id="${optionId}" name="${field.name}" 
                                       value="${option}" ${requiredAttr}>
                                <label for="${optionId}">${option}</label>
                            </div>
                        `;
                    });
                    fieldHTML += `</div>`;
                }
                break;

            case 'checkbox':
                if (field.options) {
                    fieldHTML += `<div class="checkbox-group">`;
                    field.options.forEach((option, optIndex) => {
                        const optionId = `${fieldId}_${optIndex}`;
                        fieldHTML += `
                            <div class="checkbox-option">
                                <input type="checkbox" id="${optionId}" name="${field.name}[]" 
                                       value="${option}">
                                <label for="${optionId}">${option}</label>
                            </div>
                        `;
                    });
                    fieldHTML += `</div>`;
                } else {
                    fieldHTML += `<input type="checkbox" id="${fieldId}" name="${field.name}" 
                                 value="1" ${requiredAttr}>`;
                }
                break;

            case 'file':
                fieldHTML += `
                    <div class="file-upload">
                        <input type="file" id="${fieldId}" name="${field.name}" ${requiredAttr}>
                        <label for="${fieldId}" class="file-upload-label">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <span>Click to upload file or drag and drop</span>
                        </label>
                    </div>
                `;
                break;
        }

        fieldHTML += `</div>`;
        return fieldHTML;
    }

    /**
     * Add event listeners to form fields
     */
    addFormFieldListeners() {
        // File upload handling
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const label = e.target.nextElementSibling;
                const fileName = e.target.files[0]?.name || 'Click to upload file or drag and drop';
                label.querySelector('span').textContent = fileName;
            });
        });

        // Auto-save draft on field changes
        document.querySelectorAll('.dynamic-form input, .dynamic-form select, .dynamic-form textarea').forEach(field => {
            field.addEventListener('change', () => {
                this.autoSaveDraft();
            });
        });
    }

    /**
     * Auto-save draft
     */
    autoSaveDraft() {
        if (!this.currentTemplate) return;

        try {
            const formData = this.getFormData();
            const draftKey = `flexform_draft_${this.currentTemplate.id}_${this.currentUser.email}`;
            localStorage.setItem(draftKey, JSON.stringify({
                template: this.currentTemplate.id,
                data: formData,
                savedAt: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    /**
     * Save draft manually
     */
    saveDraft() {
        if (!this.currentTemplate) {
            this.showError('No template loaded');
            return;
        }

        try {
            const formData = this.getFormData();
            const draftKey = `flexform_draft_${this.currentTemplate.id}_${this.currentUser.email}`;
            localStorage.setItem(draftKey, JSON.stringify({
                template: this.currentTemplate.id,  
                data: formData,
                savedAt: new Date().toISOString()
            }));

            this.showSuccess('Draft saved successfully!');
        } catch (error) {
            console.error('Save draft failed:', error);
            this.showError('Failed to save draft');
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        const formData = {};
        const form = document.querySelector('.dynamic-form');
        
        if (!form) return formData;

        // Get all form inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const name = input.name;
            if (!name) return;

            if (input.type === 'checkbox') {
                if (name.endsWith('[]')) {
                    // Multiple checkboxes
                    const baseName = name.slice(0, -2);
                    if (!formData[baseName]) formData[baseName] = [];
                    if (input.checked) {
                        formData[baseName].push(input.value);
                    }
                } else {
                    // Single checkbox
                    formData[name] = input.checked ? input.value : '';
                }
            } else if (input.type === 'radio') {
                if (input.checked) {
                    formData[name] = input.value;
                }
            } else if (input.type === 'file') {
                formData[name] = input.files[0]?.name || '';
            } else {
                formData[name] = input.value;
            }
        });

        return formData;
    }

    /**
     * Submit form to database
     */
    async submitForm() {
        if (!this.isConnected) {
            this.showError('Please connect to database first');
            return;
        }

        if (!this.currentTemplate) {
            this.showError('No template loaded');
            return;
        }

        // Validate form
        const formData = this.getFormData();
        const validation = this.validateFormData(formData);
        
        if (!validation.isValid) {
            this.showError(`Please fix the following errors:\n${validation.errors.join('\n')}`);
            return;
        }

        this.showLoading('Submitting form data...');

        try {
            // Prepare data for database
            const dbData = {
                ...formData,
                created_by: this.currentUser.email,
                department: this.currentUser.department,
                security_classification: 'internal',
                source_file: `${this.currentTemplate.name} - User Submission`,
                created_at: new Date().toISOString()
            };

            // Encrypt sensitive data if needed
            if (dbData.contact_organizer || dbData.requester_email) {
                const emailField = dbData.contact_organizer || dbData.requester_email;
                if (emailField && emailField.includes('@')) {
                    dbData.contact_organizer_encrypted = this.encryptData(emailField);
                    dbData.contact_organizer_hash = this.hashData(emailField);
                    delete dbData.contact_organizer;
                    delete dbData.requester_email;
                }
            }

            // Submit to database
            const { data, error } = await this.supabase
                .from('gemba_requests')
                .insert([dbData])
                .select();

            if (error) {
                throw new Error(error.message);
            }

            this.hideLoading();
            this.showSuccess('Form submitted successfully!');
            
            // Clear form and remove draft
            this.clearForm();
            this.removeDraft();
            
            // Refresh dashboard
            this.refreshDashboard();

        } catch (error) {
            console.error('Submit error:', error);
            this.hideLoading();
            this.showError(`Failed to submit form: ${error.message}`);
        }
    }

    /**
     * Validate form data
     */
    validateFormData(formData) {
        const errors = [];
        
        // Get required fields from current template
        const templateConfig = localStorage.getItem(`flexform_template_${this.currentTemplate.id}`);
        let requiredFields = [];
        
        if (templateConfig) {
            try {
                const config = JSON.parse(templateConfig);
                requiredFields = config.fields.filter(f => f.required).map(f => f.name);
            } catch (error) {
                // Use default required fields
                requiredFields = ['short_description', 'contact_organizer', 'location'];
            }
        } else {
            requiredFields = this.getDefaultTemplateFields(this.currentTemplate.id)
                .filter(f => f.required)
                .map(f => f.name);
        }

        // Check required fields
        requiredFields.forEach(fieldName => {
            if (!formData[fieldName] || formData[fieldName].toString().trim() === '') {
                errors.push(`${fieldName.replace('_', ' ')} is required`);
            }
        });

        // Validate email fields
        Object.keys(formData).forEach(key => {
            if ((key.includes('email') || key.includes('organizer')) && formData[key]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData[key])) {
                    errors.push(`${key.replace('_', ' ')} must be a valid email address`);
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Clear form
     */
    clearForm() {
        const form = document.querySelector('.dynamic-form');
        if (form) {
            form.querySelectorAll('input, select, textarea').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
        
        document.getElementById('formActions').style.display = 'none';
        document.getElementById('userFormContainer').innerHTML = `
            <div class="form-placeholder">
                <i class="fas fa-file-alt"></i>
                <h3>Select a Template to Begin</h3>
                <p>Choose a form template from the dropdown above to start submitting data.</p>
            </div>
        `;
    }

    /**
     * Remove saved draft
     */
    removeDraft() {
        if (!this.currentTemplate) return;
        
        const draftKey = `flexform_draft_${this.currentTemplate.id}_${this.currentUser.email}`;
        localStorage.removeItem(draftKey);
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard() {
        if (!this.isConnected) return;

        try {
            // Get total records count
            const { count: totalCount, error: totalError } = await this.supabase
                .from('gemba_requests')
                .select('*', { count: 'exact', head: true });

            if (totalError) throw totalError;

            // Get user's records count
            const { count: userCount, error: userError } = await this.supabase
                .from('gemba_requests')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', this.currentUser.email);

            if (userError) throw userError;

            // Get recent records (this month)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count: recentCount, error: recentError } = await this.supabase
                .from('gemba_requests')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth.toISOString());

            if (recentError) throw recentError;

            // Update dashboard stats
            document.getElementById('totalRecords').textContent = totalCount || 0;
            document.getElementById('myRecords').textContent = userCount || 0;
            document.getElementById('recentRecords').textContent = recentCount || 0;

            // Load recent submissions
            await this.loadRecentSubmissions();

        } catch (error) {
            console.error('Dashboard refresh error:', error);
        }
    }

    /**
     * Load recent submissions
     */
    async loadRecentSubmissions() {
        try {
            const { data, error } = await this.supabase
                .from('gemba_requests')
                .select('*')
                .eq('created_by', this.currentUser.email)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            const container = document.getElementById('recentSubmissionsList');
            
            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No submissions yet. Start by submitting your first form!</p>
                    </div>
                `;
                return;
            }

            let html = '';
            data.forEach(record => {
                const createdDate = new Date(record.created_at).toLocaleDateString();
                const title = record.short_description || record.request_title || 'Untitled Submission';
                
                html += `
                    <div class="submission-item">
                        <div class="submission-info">
                            <div class="submission-title">${title}</div>
                            <div class="submission-meta">
                                ${createdDate} • ${record.department} • ID: ${record.id}
                            </div>
                        </div>
                        <div class="submission-actions">
                            <button class="view-btn" onclick="flexFormUser.viewSubmission(${record.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (error) {
            console.error('Load recent submissions error:', error);
        }
    }

    /**
     * View submission details
     */
    async viewSubmission(id) {
        try {
            const { data, error } = await this.supabase
                .from('gemba_requests')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Create view modal (simplified version)
            let html = '<div class="submission-details">';
            html += `<h4>Submission Details (ID: ${data.id})</h4>`;
            html += `<p><strong>Created:</strong> ${new Date(data.created_at).toLocaleString()}</p>`;
            html += `<p><strong>Department:</strong> ${data.department}</p>`;
            
            // Show non-sensitive fields
            Object.keys(data).forEach(key => {
                if (!key.includes('encrypted') && !key.includes('hash') && 
                    !['id', 'created_at', 'updated_at', 'created_by', 'department'].includes(key) &&
                    data[key]) {
                    html += `<p><strong>${key.replace('_', ' ')}:</strong> ${data[key]}</p>`;
                }
            });
            
            html += '</div>';

            // Show in success modal
            document.getElementById('successMessage').innerHTML = html;
            document.getElementById('successModal').style.display = 'block';

        } catch (error) {
            console.error('View submission error:', error);
            this.showError('Failed to load submission details');
        }
    }

    /**
     * Set default export dates
     */
    setDefaultExportDates() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Only set dates if elements exist (for backwards compatibility)
        const startDateEl = document.getElementById('exportStartDate');
        const endDateEl = document.getElementById('exportEndDate');
        
        if (startDateEl) startDateEl.value = startOfMonth.toISOString().split('T')[0];
        if (endDateEl) endDateEl.value = today.toISOString().split('T')[0];
    }

    /**
     * Load user data from database
     */
    async loadUserData() {
        if (!this.isConnected) {
            return;
        }

        try {
            // Use a default table name if currentUser isn't set
            const tableName = this.currentUser?.tableName || 'gemba_requests';
            
            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            this.userData = data || [];
            return this.userData;
        } catch (error) {
            console.error('Error loading user data:', error);
            this.userData = [];
            return [];
        }
    }

    /**
     * Preview export data
     */
    async previewExportData() {
        if (!this.isConnected) {
            this.showError('Please connect to database first');
            return;
        }

        this.showLoading('Loading data preview...');

        try {
            const filters = this.getExportFilters();
            let query = this.supabase.from('gemba_requests').select('*');

            // Apply filters
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate);
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                query = query.lte('created_at', endDate.toISOString());
            }
            if (filters.department) {
                query = query.eq('department', filters.department);
            }
            if (filters.recordType === 'my') {
                query = query.eq('created_by', this.currentUser.email);
            } else if (filters.recordType === 'team') {
                query = query.eq('department', this.currentUser.department);
            }

            // Apply limit
            if (filters.limit !== 'all') {
                query = query.limit(parseInt(filters.limit));
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            this.userData = data || [];
            this.renderPreviewTable(this.userData);
            
            document.getElementById('previewCount').textContent = `${this.userData.length} records`;

            this.hideLoading();

        } catch (error) {
            console.error('Preview data error:', error);
            this.hideLoading();
            this.showError(`Failed to load data: ${error.message}`);
        }
    }

    /**
     * Get export filters
     */
    getExportFilters() {
        return {
            startDate: document.getElementById('exportStartDate').value,
            endDate: document.getElementById('exportEndDate').value,
            department: document.getElementById('exportDepartment').value,
            recordType: document.getElementById('exportRecordType').value,
            limit: document.getElementById('exportLimit').value
        };
    }

    /**
     * Render preview table
     */
    renderPreviewTable(data) {
        const container = document.getElementById('exportPreviewTable');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-preview">
                    <i class="fas fa-table"></i>
                    <p>No data found with current filters</p>
                </div>
            `;
            return;
        }

        // Get visible columns (exclude sensitive/system fields)
        const excludeFields = ['contact_organizer_encrypted', 'contact_organizer_hash', 'data_hash', 'audit_log'];
        const columns = Object.keys(data[0]).filter(key => !excludeFields.includes(key));

        let html = '<table><thead><tr>';
        columns.forEach(col => {
            html += `<th>${col.replace('_', ' ')}</th>`;
        });
        html += '</tr></thead><tbody>';

        data.slice(0, 100).forEach(record => { // Show max 100 rows in preview
            html += '<tr>';
            columns.forEach(col => {
                let value = record[col] || '';
                if (typeof value === 'string' && value.length > 50) {
                    value = value.substring(0, 50) + '...';
                }
                html += `<td>${value}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        
        if (data.length > 100) {
            html += `<p class="preview-note">Showing first 100 rows. Full export will include all ${data.length} records.</p>`;
        }

        container.innerHTML = html;
    }

    /**
     * Export data to specified format
     */
    async exportData(format) {
        if (!this.isConnected) {
            this.showError('Please connect to database first');
            return;
        }

        this.showLoading(`Exporting to ${format.toUpperCase()}...`);

        try {
            // Load fresh data for export if not already loaded
            if (!this.userData || this.userData.length === 0) {
                await this.loadUserData();
            }

            if (!this.userData || this.userData.length === 0) {
                this.showError('No data available to export');
                this.hideLoading();
                return;
            }
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `flexform_export_${timestamp}`;

            switch (format) {
                case 'pdf':
                    await this.exportToPDF(this.userData, filename);
                    break;
                case 'excel':
                    await this.exportToExcel(this.userData, filename);
                    break;
                case 'csv':
                    await this.exportToCSV(this.userData, filename);
                    break;
                default:
                    throw new Error('Unsupported export format');
            }

            this.hideLoading();
            this.showSuccess(`Data exported to ${format.toUpperCase()} successfully!`);

        } catch (error) {
            console.error('Export error:', error);
            this.hideLoading();
            this.showError(`Export failed: ${error.message}`);
        }
    }

    /**
     * Export to PDF
     */
    async exportToPDF(data, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text('FLEX-FORM Data Export', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Records: ${data.length}`, 20, 40);
        doc.text(`User: ${this.currentUser.email}`, 20, 50);

        // Add data (simplified table)
        let yPosition = 70;
        const pageHeight = doc.internal.pageSize.height;

        data.forEach((record, index) => {
            if (yPosition > pageHeight - 30) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(10);
            doc.text(`Record ${index + 1}:`, 20, yPosition);
            yPosition += 10;

            // Show key fields
            const keyFields = ['id', 'short_description', 'location', 'created_at', 'department'];
            keyFields.forEach(field => {
                if (record[field]) {
                    const value = typeof record[field] === 'string' && record[field].length > 60 
                        ? record[field].substring(0, 60) + '...' 
                        : record[field];
                    doc.text(`${field}: ${value}`, 25, yPosition);
                    yPosition += 7;
                }
            });

            yPosition += 5; // Space between records
        });

        doc.save(`${filename}.pdf`);
    }

    /**
     * Export to Excel
     */
    async exportToExcel(data, filename) {
        // Prepare data for Excel
        const cleanData = data.map(record => {
            const cleanRecord = {};
            Object.keys(record).forEach(key => {
                // Exclude sensitive/system fields
                if (!key.includes('encrypted') && !key.includes('hash') && key !== 'audit_log') {
                    cleanRecord[key.replace('_', ' ')] = record[key];
                }
            });
            return cleanRecord;
        });

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(cleanData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'FLEX-FORM Data');

        // Add metadata sheet
        const metadata = [
            { Property: 'Export Date', Value: new Date().toLocaleString() },
            { Property: 'Total Records', Value: data.length },
            { Property: 'Exported By', Value: this.currentUser.email },
            { Property: 'Department', Value: this.currentUser.department },
            { Property: 'Source', Value: 'FLEX-FORM System' }
        ];
        const metaWs = XLSX.utils.json_to_sheet(metadata);
        XLSX.utils.book_append_sheet(wb, metaWs, 'Export Info');

        // Save file
        XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    /**
     * Export to CSV
     */
    async exportToCSV(data, filename) {
        // Prepare CSV data
        const excludeFields = ['contact_organizer_encrypted', 'contact_organizer_hash', 'data_hash', 'audit_log'];
        const columns = Object.keys(data[0]).filter(key => !excludeFields.includes(key));

        let csv = columns.join(',') + '\n';

        data.forEach(record => {
            const row = columns.map(col => {
                let value = record[col] || '';
                // Escape commas and quotes
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""');
                    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                        value = `"${value}"`;
                    }
                }
                return value;
            });
            csv += row.join(',') + '\n';
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Simple encryption simulation
     */
    encryptData(data) {
        return btoa(data) + '_encrypted';
    }

    /**
     * Simple hash simulation  
     */
    hashData(data) {
        return btoa(data + 'salt').substring(0, 32);
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(message, type) {
        const status = document.getElementById('userConnectionStatus');
        status.textContent = message;
        status.className = `status ${type}`;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        document.getElementById('successMessage').innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <p>${message}</p>
            </div>
        `;
        document.getElementById('successModal').style.display = 'block';
    }

    /**
     * Show error message
     */
    showError(message) {
        document.getElementById('errorMessage').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
        document.getElementById('errorModal').style.display = 'block';
    }

    /**
     * Show loading overlay
     */
    showLoading(message) {
        document.getElementById('loadingMessage').textContent = message;
        document.getElementById('loadingOverlay').classList.add('active');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }
}

// Initialize the user interface
const flexFormUser = new FlexFormUser();

// Make it globally available for onclick handlers
window.flexFormUser = flexFormUser;

// Load templates on page load
document.addEventListener('DOMContentLoaded', function() {
    flexFormUser.loadTemplates();
});
