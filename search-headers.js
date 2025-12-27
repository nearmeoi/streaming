// search-headers.js - Find specific header patterns
import fs from 'fs';

const dexDir = 'h:/streaming/apk_extracted';

// Search for exact header names and related patterns
const patterns = [
    'xhel',
    'xss',
    '"ft"',
    'ft:',
    'datas',
    'signData',
    'signHeader',
    'getSign',
    'createSign',
    'encryptData',
    'RequestSign',
    'OkHttp',
    'Interceptor',
    'beast',
    'hipporeels',
    'dramabox'
];

const dexFiles = fs.readdirSync(dexDir).filter(f => f.endsWith('.dex'));

console.log('Searching for header-related patterns...\n');

for (const dexFile of dexFiles) {
    const filePath = `${dexDir}/${dexFile}`;
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('latin1');

    for (const pattern of patterns) {
        const lowerContent = content.toLowerCase();
        const lowerPattern = pattern.toLowerCase();

        let idx = lowerContent.indexOf(lowerPattern);
        if (idx !== -1) {
            // Extract context
            const start = Math.max(0, idx - 30);
            const end = Math.min(content.length, idx + pattern.length + 80);
            const context = content.substring(start, end).replace(/[^\x20-\x7E]/g, '.');

            console.log(`[${dexFile}] "${pattern}":`);
            console.log(`  ...${context}...`);
            console.log('');
        }
    }
}

console.log('Done!');
