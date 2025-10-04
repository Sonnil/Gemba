// Encrypted Configuration for FLEX-FORM
// This file contains encrypted service keys for enhanced security

window.FLEXFORM_SECURE_CONFIG = {
    // Basic configuration (safe to expose)
    SUPABASE_URL: 'https://rctzljfqsafjmbljeyrb.supabase.co',
    
    // Public anon key (safe for client-side use)
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdHpsamZxc2Fmam1ibGpleXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTY5NDAsImV4cCI6MjA3NTA5Mjk0MH0.cwIecLyT7z3eQhUl0HWimrWZUDCkO6-jSdxO8xBLcuc',
    
    // Encrypted service key configuration
    SERVICE_KEY_CONFIG: {
    encrypted: true,
    serviceKey: 'O9QcY7gVctJv4MUzOoyAMLlQVDOCne+gFEFhgQAhf2wFF2TsRwI5gVVtVqjC9Kdn7OAJ0MrG1yQ9Er+IYW4xETNqjHSWjTeo08zQSDoNZ2ZVn5/i7IOQjyukhCClkKQ0+HRM0Q4gNF64ggGY51tcbWSHbyAqrnjTWxpDF1mDOlNluVYyKKYkgIHyc4gGsUJ8D6w8WuX5Fd03Iecgg0xgzHi2QsUEmpxHxEJvT386tqOkMP2up9PBdm1Sjibbv2q+libY2b89sgnr/n91FTrQ2mlUKS3IdDj/cYiuXjckz5qtcDGQCYsW1CLerhwph0HKCyiLgKGxkw==',
    algorithm: 'AES-GCM',
    keyDerivation: 'PBKDF2',
    hint: 'Enter master password to decrypt service key'
},
    
    // Security settings
    SECURITY: {
        encryptionEnabled: true,
        requireMasterPassword: true,
        keyRotationDays: 90,
        auditLogging: true
    },
    
    // Application settings
    AUTO_CONNECT: true,
    DEFAULT_USER: {
        email: 'admin@company.com',
        department: 'admin'
    }
};

// Secure configuration loader
class SecureConfigLoader {
    constructor() {
        this.keyManager = new SecureKeyManager();
        this.serviceKey = null;
    }

    /**
     * Prompt user for master password and decrypt service key
     */
    async unlockServiceKey() {
        try {
            const config = window.FLEXFORM_SECURE_CONFIG.SERVICE_KEY_CONFIG;
            
            if (!config.encrypted) {
                console.log('ℹ️ Service key not encrypted');
                return config.serviceKey;
            }

            // Prompt for master password
            const masterPassword = prompt(
                '🔐 Enter master password to unlock service key:\n\n' +
                'This is required for admin operations and database setup.\n' +
                'Contact your system administrator if you don\'t have this password.'
            );

            if (!masterPassword) {
                throw new Error('Master password required');
            }

            // Decrypt service key
            this.serviceKey = await this.keyManager.loadEncryptedServiceKey(
                config, 
                masterPassword
            );

            console.log('✅ Service key unlocked successfully');
            return this.serviceKey;

        } catch (error) {
            console.error('❌ Failed to unlock service key:', error);
            alert('Failed to unlock service key. Please check your password.');
            throw error;
        }
    }

    /**
     * Get configuration with decrypted service key if needed
     */
    async getSecureConfig(needsServiceKey = false) {
        const config = {
            supabaseUrl: window.FLEXFORM_SECURE_CONFIG.SUPABASE_URL,
            supabaseAnonKey: window.FLEXFORM_SECURE_CONFIG.SUPABASE_ANON_KEY,
            autoConnect: window.FLEXFORM_SECURE_CONFIG.AUTO_CONNECT,
            defaultUser: window.FLEXFORM_SECURE_CONFIG.DEFAULT_USER
        };

        if (needsServiceKey) {
            if (!this.serviceKey) {
                config.supabaseServiceKey = await this.unlockServiceKey();
            } else {
                config.supabaseServiceKey = this.serviceKey;
            }
        }

        return config;
    }

    /**
     * Check if service key is available without prompting
     */
    hasServiceKey() {
        return this.serviceKey !== null;
    }

    /**
     * Clear cached service key for security
     */
    clearServiceKey() {
        this.serviceKey = null;
        console.log('🔒 Service key cleared from memory');
    }
}

// Global secure config loader
window.secureConfigLoader = new SecureConfigLoader();
