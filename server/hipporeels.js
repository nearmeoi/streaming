// hipporeels.js - Direct API client for HippoReels/DramaBox mobile API
// Signatures are loaded from signatures.json - edit that file to update

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://dny.hipporeels.com';
const SIGNATURES_FILE = path.join(__dirname, 'signatures.json');

// Load signatures from file
function loadSignatures() {
    try {
        const data = fs.readFileSync(SIGNATURES_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        console.log(`[HippoReels] Loaded signatures from file (last updated: ${parsed.lastUpdated || 'unknown'})`);
        return parsed;
    } catch (error) {
        console.error('[HippoReels] Error loading signatures.json:', error.message);
        return {
            ft: "",
            xhel: "",
            xss: ""
        };
    }
}

// Save signatures to file
function saveSignatures(ft, xhel, xss) {
    const data = {
        ft,
        xhel,
        xss,
        lastUpdated: new Date().toISOString(),
        note: "Update values dari HTTP Toolkit saat expired. Endpoint: POST /api/hippo/update-signatures"
    };
    fs.writeFileSync(SIGNATURES_FILE, JSON.stringify(data, null, 4));
    console.log('[HippoReels] Signatures saved to file');
}

// Current signatures (loaded from file)
let currentSignatures = loadSignatures();

// Watch for file changes and auto-reload
fs.watchFile(SIGNATURES_FILE, { interval: 2000 }, () => {
    console.log('[HippoReels] signatures.json changed, reloading...');
    currentSignatures = loadSignatures();
});

// Default device data - Update these from your HTTP Toolkit captures
const DEFAULT_DEVICE_DATA = {
    tdid: "A7125321766828146836NWBzj2Lz",
    did: "823bc4f6-0d5e-4837-9d9e-7ea917c03c06",
    userId: "A2046740",
    country: "ID",
    tz: "Asia/Shanghai",
    tzOffset: "+0800",
    sysLan: "in",
    appLan: "in",
    pname: "com.miniframe.hippo",
    os: "0",
    brand: "samsung",
    model: "SM-G965N",
    osVer: "9",
    ins: "1766828117833",
    nowCh: "RLA20250818",
    nowChTime: "1766828147",
    appVer: "2.4.5",
    p: "1",
    dm: "",
    platform: "android",
    pline: "9",
    apn: "0",
    androidId: "000000006d6100a96d6100a900000000",
    afid: "1766828145912-2067282912057206710",
    pushEnable: "1"
};

/**
 * Make a request to HippoReels API
 * @param {string} endpoint - API endpoint path (e.g., '/beast/portal/1000')
 * @param {object} body - Request body (optional)
 */
async function hippoRequest(endpoint, body = {}) {
    const url = `${BASE_URL}${endpoint}`;

    console.log(`[HippoReels] POST ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept-Encoding': 'gzip',
                'Connection': 'Keep-Alive',
                'Content-Type': 'application/json; charset=utf-8',
                'User-Agent': 'okhttp/4.10.0',
                'Host': 'dny.hipporeels.com',
                'X-Request-ID': generateUUID(),
                'datas': JSON.stringify(DEFAULT_DEVICE_DATA),
                'ft': currentSignatures.ft,
                'xhel': currentSignatures.xhel,
                'xss': currentSignatures.xss
            },
            body: JSON.stringify(body)
        });

        console.log(`[HippoReels] Response Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[HippoReels] Error Response: ${errorText}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error(`[HippoReels] Request failed:`, error.message);
        return { success: false, error: error.message, data: null };
    }
}

// Generate UUID for X-Request-ID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============== API ENDPOINTS ==============

/**
 * Get home/config data (portal 1000)
 */
export async function getHomeConfig() {
    return await hippoRequest('/beast/portal/1000', {});
}

/**
 * Get portal 1001 data
 */
export async function getPortal1001() {
    return await hippoRequest('/beast/portal/1001', {});
}

/**
 * Get portal 1003 data (the one you asked about)
 */
export async function getPortal1003() {
    return await hippoRequest('/beast/portal/1003', {});
}

/**
 * Get portal 1025 data
 */
export async function getPortal1025() {
    return await hippoRequest('/beast/portal/1025', {});
}

/**
 * Get portal 1030 data
 */
export async function getPortal1030() {
    return await hippoRequest('/beast/portal/1030', {});
}

/**
 * Generic portal request
 * @param {number} portalId - Portal ID (1000, 1001, 1003, etc.)
 * @param {object} body - Request body
 */
export async function getPortal(portalId, body = {}) {
    return await hippoRequest(`/beast/portal/${portalId}`, body);
}

/**
 * Update signatures (saves to file and reloads)
 * Call this with new captured values from HTTP Toolkit
 */
export function updateSignatures(ft, xhel, xss) {
    saveSignatures(ft, xhel, xss);
    currentSignatures = { ft, xhel, xss };
    console.log('[HippoReels] Signatures updated and saved');
}

/**
 * Get current signatures
 */
export function getSignatures() {
    return { ...currentSignatures };
}

/**
 * Update device data
 */
export function updateDeviceData(newData) {
    Object.assign(DEFAULT_DEVICE_DATA, newData);
    console.log('[HippoReels] Device data updated');
}

export default {
    getHomeConfig,
    getPortal1001,
    getPortal1003,
    getPortal1025,
    getPortal1030,
    getPortal,
    updateSignatures,
    getSignatures,
    updateDeviceData
};
