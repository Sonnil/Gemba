/**
 * Secure Key Manager for FLEX-FORM
 * Provides encryption/decryption for sensitive API keys
 */

class SecureKeyManager {
    constructor() {
        this.encryptionKey = null;
        this.initialized = false;
    }

    /**
     * Initialize the key manager with a master password
     */
    async initialize(masterPassword) {
        try {
            // Generate encryption key from password
            const encoder = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                encoder.encode(masterPassword),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            // Derive AES key
            this.encryptionKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: encoder.encode('flex-form-salt-2025'),
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );

            this.initialized = true;
            console.log('🔐 Secure Key Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Key manager initialization failed:', error);
            return false;
        }
    }

    /**
     * Encrypt a service key
     */
    async encryptKey(plainKey) {
        if (!this.initialized) {
            throw new Error('Key manager not initialized');
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(plainKey);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                data
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            // Return base64 encoded
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('❌ Encryption failed:', error);
            throw error;
        }
    }

    /**
     * Decrypt a service key
     */
    async decryptKey(encryptedKey) {
        if (!this.initialized) {
            throw new Error('Key manager not initialized');
        }

        try {
            // Decode from base64
            const combined = new Uint8Array(
                atob(encryptedKey).split('').map(char => char.charCodeAt(0))
            );

            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            throw error;
        }
    }

    /**
     * Generate encrypted config template
     */
    async generateEncryptedConfig(plainServiceKey, masterPassword) {
        await this.initialize(masterPassword);
        const encryptedKey = await this.encryptKey(plainServiceKey);
        
        return {
            encrypted: true,
            serviceKey: encryptedKey,
            hint: 'Service key encrypted with master password',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Load encrypted service key
     */
    async loadEncryptedServiceKey(encryptedConfig, masterPassword) {
        if (!encryptedConfig.encrypted) {
            return encryptedConfig.serviceKey; // Plain text fallback
        }

        await this.initialize(masterPassword);
        return await this.decryptKey(encryptedConfig.serviceKey);
    }
}

// Export for use in other modules
window.SecureKeyManager = SecureKeyManager;
