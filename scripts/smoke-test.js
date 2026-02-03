#!/usr/bin/env node

/**
 * Smoke test for API health checks
 * Validates that basic endpoints return expected status codes
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const TESTS = [
  {
    name: "GET /api/health (should return 200 with build info)",
    method: "GET",
    path: "/api/health",
    expectedStatus: 200,
  },
  {
    name: "GET /api/subscription/plan (should return 200)",
    method: "GET",
    path: "/api/subscription/plan",
    expectedStatus: 200,
  },
  {
    name: "GET /api/subscription/plans (should return 200)",
    method: "GET",
    path: "/api/subscription/plans",
    expectedStatus: 200,
  },
  {
    name: "POST /api/auth/login with invalid creds (should return 401, NOT 500)",
    method: "POST",
    path: "/api/auth/login",
    body: JSON.stringify({ email: "invalid@test.com", password: "wrong" }),
    expectedStatus: 401,
  },
  {
    name: "POST /api/auth/login with empty body (should return 400)",
    method: "POST",
    path: "/api/auth/login",
    body: JSON.stringify({}),
    expectedStatus: 400,
  },
];

async function runTest(test, baseUrl) {
  return new Promise((resolve) => {
    const url = new URL(baseUrl + test.path);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false, // Allow self-signed certs
    };

    if (test.body) {
      options.headers['Content-Length'] = Buffer.byteLength(test.body);
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const passed = res.statusCode === test.expectedStatus;
        const symbol = passed ? '✓' : '✗';
        const status = `${symbol} ${res.statusCode}`;
        const color = passed ? '\x1b[32m' : '\x1b[31m';
        
        console.log(`${color}${status}\x1b[0m ${test.name}`);
        if (!passed) {
          console.log(`  Expected: ${test.expectedStatus}, Got: ${res.statusCode}`);
          if (data) console.log(`  Response: ${data.substring(0, 100)}`);
        }
        
        resolve({ test: test.name, passed, status: res.statusCode });
      });
    });

    req.on('error', (e) => {
      console.log(`\x1b[31m✗ ERR\x1b[0m ${test.name}`);
      console.log(`  Error: ${e.message}`);
      resolve({ test: test.name, passed: false, error: e.message });
    });

    if (test.body) {
      req.write(test.body);
    }
    req.end();
  });
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:5000';
  
  console.log(`\n=== API Smoke Tests ===`);
  console.log(`Target: ${baseUrl}\n`);

  const results = [];
  for (const test of TESTS) {
    const result = await runTest(test, baseUrl);
    results.push(result);
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✓ All smoke tests passed!\n');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed\n');
    process.exit(1);
  }
}

main();
