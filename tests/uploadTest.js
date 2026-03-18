/**
 * Upload test – verifies POST /api/import/excel works on localhost:3000
 * Also tests the /api-proxy/import/excel alias.
 *
 * Usage:  node tests/uploadTest.js
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('../server/node_modules/exceljs');

const SERVER = 'http://localhost:3000';

// ── helpers ──────────────────────────────────────────────────────────

function buildMultipart(filePath, fieldName) {
  const boundary = '----TestBoundary' + Date.now();
  const fileData = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
    `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);

  return {
    body: Buffer.concat([header, fileData, footer]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function request(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, SERVER);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers,
    };

    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let json;
        try { json = JSON.parse(raw); } catch { json = null; }
        resolve({ status: res.statusCode, body: json, raw });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── generate a tiny sample xlsx ──────────────────────────────────────

async function createSampleExcel(outPath) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');

  ws.addRow(['樣品編號', '食品分類', '樣品名稱', '熱量(kcal)', '粗蛋白(g)', '粗脂肪(g)',
             '飽和脂肪(g)', '反式脂肪(mg)', '碳水化合物(g)', '糖質總量(g)', '膳食纖維(g)', '鈉(mg)']);
  ws.addRow(['A00001', '穀物', '白米飯', 183, 3.1, 0.3, 0.1, 0, 41, 0.1, 0.4, 2]);
  ws.addRow(['A00002', '蔬菜', '花椰菜', 28, 3.7, 0.3, 0.1, 0, 4.3, 1.5, 3.3, 30]);

  await wb.xlsx.writeFile(outPath);
}

// ── tests ────────────────────────────────────────────────────────────

async function main() {
  let passed = 0;
  let failed = 0;

  function ok(label, cond, detail) {
    if (cond) { console.log(`  ✓ ${label}`); passed++; }
    else { console.log(`  ✗ ${label} — ${detail || 'failed'}`); failed++; }
  }

  // 0. Health check – make sure server is running
  console.log('\n── Health check ──');
  try {
    const h = await request('GET', '/api/health');
    ok('GET /api/health returns 200', h.status === 200, `got ${h.status}`);
  } catch (e) {
    console.error(`  ✗ Server not reachable at ${SERVER} — is it running?  (${e.message})`);
    process.exit(1);
  }

  // 0b. Health check via /api-proxy
  console.log('\n── Health check via /api-proxy ──');
  const hp = await request('GET', '/api-proxy/health');
  ok('GET /api-proxy/health returns 200', hp.status === 200, `got ${hp.status}`);

  // 1. Upload without file → 400
  console.log('\n── Upload without file ──');
  const r1 = await request('POST', '/api/import/excel', null, { 'Content-Type': 'application/json' });
  ok('POST /api/import/excel (no file) → 400', r1.status === 400, `got ${r1.status}: ${r1.raw}`);

  // 2. Upload a valid sample xlsx
  console.log('\n── Upload valid Excel via /api/import/excel ──');
  const samplePath = path.resolve(__dirname, '_test_sample.xlsx');
  await createSampleExcel(samplePath);

  const mp = buildMultipart(samplePath, 'file');
  const r2 = await request('POST', '/api/import/excel', mp.body, {
    'Content-Type': mp.contentType,
    'Content-Length': mp.body.length,
  });
  ok('POST /api/import/excel → 200', r2.status === 200, `got ${r2.status}: ${r2.raw}`);
  ok('Response has total & imported', r2.body && r2.body.total === 2 && r2.body.imported === 2,
     JSON.stringify(r2.body));

  // 3. Same upload via /api-proxy path
  console.log('\n── Upload valid Excel via /api-proxy/import/excel ──');
  const mp2 = buildMultipart(samplePath, 'file');
  const r3 = await request('POST', '/api-proxy/import/excel', mp2.body, {
    'Content-Type': mp2.contentType,
    'Content-Length': mp2.body.length,
  });
  ok('POST /api-proxy/import/excel → 200', r3.status === 200, `got ${r3.status}: ${r3.raw}`);

  // cleanup
  fs.unlinkSync(samplePath);

  console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
