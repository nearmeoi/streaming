// search-context.js - Find context around signature-related strings
import fs from 'fs';
import path from 'path';

const dexDir = 'h:/streaming/apk_extracted';
const searchStrings = ['xhel', 'xss', 'beast/portal', 'HmacSHA', 'addHeader'];

const dexFiles = fs.readdirSync(dexDir).filter(f => f.endsWith('.dex'));

console.log('Searching for specific patterns in DEX files...\n');

for (const dexFile of dexFiles) {
    const filePath = path.join(dexDir, dexFile);
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('latin1');

    for (const searchStr of searchStrings) {
        let idx = content.indexOf(searchStr);
        while (idx !== -1) {
            // Extract surrounding context (100 chars before and after)
            const start = Math.max(0, idx - 50);
            const end = Math.min(content.length, idx + searchStr.length + 100);
            const context = content.substring(start, end);

            // Clean up non-printable characters for display
            const cleaned = context.replace(/[^\x20-\x7E]/g, '.');

            console.log(`\n[${dexFile}] Found "${searchStr}" at offset ${idx}:`);
            console.log(`  Context: ...${cleaned}...`);

            // Find next occurrence
            idx = content.indexOf(searchStr, idx + 1);
        }
    }
}

console.log('\n---\nDone!');
