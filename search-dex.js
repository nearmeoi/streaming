// search-dex.js - Search for strings in DEX files
import fs from 'fs';
import path from 'path';

const searchStrings = ['xhel', 'xss', 'ft', 'sign', 'hmac', 'sha256', 'encrypt', 'decrypt', 'secret', 'token', 'beast/portal'];

const dexDir = 'h:/streaming/apk_extracted';

// Get all DEX files
const dexFiles = fs.readdirSync(dexDir).filter(f => f.endsWith('.dex'));

console.log(`Found ${dexFiles.length} DEX files`);
console.log('Searching for strings:', searchStrings.join(', '));
console.log('---');

for (const dexFile of dexFiles) {
    const filePath = path.join(dexDir, dexFile);
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('latin1'); // Use latin1 to preserve bytes

    let found = [];
    for (const str of searchStrings) {
        if (content.toLowerCase().includes(str.toLowerCase())) {
            found.push(str);
        }
    }

    if (found.length > 0) {
        console.log(`${dexFile}: Found [${found.join(', ')}]`);
    }
}

console.log('---');
console.log('Done!');
