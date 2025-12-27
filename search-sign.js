// search-sign-header.js - Find the signing implementation
import fs from 'fs';

const dexDir = 'h:/streaming/apk_extracted';

// Focus on sign-related patterns
const patterns = [
    'getSignHeader',
    'signHeader',
    'signData',
    'encryptHeader',
    'RequestInterceptor',
    'dny.hipporeels',
    'xhel',
    'ft"',
    'xss"',
    'datas"',
    'HmacSHA256',
    'Base64',
    'secretKey',
    'apiKey',
    'appSecret'
];

const dexFiles = fs.readdirSync(dexDir).filter(f => f.endsWith('.dex'));

for (const dexFile of dexFiles) {
    const filePath = `${dexDir}/${dexFile}`;
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('latin1');

    for (const pattern of patterns) {
        const lowerContent = content.toLowerCase();
        const lowerPattern = pattern.toLowerCase();

        // Find ALL occurrences
        let idx = lowerContent.indexOf(lowerPattern);
        let count = 0;
        while (idx !== -1 && count < 3) {
            const start = Math.max(0, idx - 60);
            const end = Math.min(content.length, idx + pattern.length + 100);
            const context = content.substring(start, end).replace(/[^\x20-\x7E]/g, '.');

            console.log(`[${dexFile}] "${pattern}" @ ${idx}:`);
            console.log(`  ${context}`);
            console.log('');

            idx = lowerContent.indexOf(lowerPattern, idx + 1);
            count++;
        }
    }
}
