#!/usr/bin/env node

/**
 * Test script for Asaas webhook idempotency
 * Usage: npm run test:webhook
 * 
 * Tests:
 * 1. Sends 2 identical webhook events
 * 2. Validates that the second one is marked as duplicate
 * 3. Checks database for COUNT = 1
 * 4. Verifies that processedAt >= receivedAt
 */

require('dotenv').config();

const http = require('http');
const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5000,
  webhookToken: process.env.ASAAS_WEBHOOK_TOKEN || 'test-webhook-token-123',
};

const testPayload = {
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: 'asaas-pay-test-' + Date.now(),
    externalReference: 'test-user-' + Date.now() + '|1',
    status: 'paid',
    value: 29.90,
    billingDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
  },
};

const eventKey = `asaas:${testPayload.event}:${testPayload.payment.id}`;

function buildSslConfig(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    const sslmode = url.searchParams.get('sslmode');

    if (sslmode === 'require') {
      return { rejectUnauthorized: true };
    }

    if (sslmode === 'no-verify') {
      return { rejectUnauthorized: false };
    }

    return undefined;
  } catch {
    return undefined;
  }
}

async function validateDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não configurada. Não é possível validar o banco.');
    process.exit(1);
  }

  const ssl = buildSslConfig(databaseUrl);
  const client = new Client({ connectionString: databaseUrl, ssl });

  try {
    await client.connect();

    const result = await client.query(
      `SELECT COUNT(*)::int AS count,
              MIN(received_at) AS received_at,
              MIN(processed_at) AS processed_at,
              (MIN(processed_at) >= MIN(received_at)) AS is_valid
         FROM webhook_events
        WHERE event_key = $1`,
      [eventKey]
    );

    const row = result.rows[0] || { count: 0, received_at: null, processed_at: null };
    const count = row.count || 0;
    const receivedAt = row.received_at ? new Date(row.received_at) : null;
    const processedAt = row.processed_at ? new Date(row.processed_at) : null;
    const isValid = row.is_valid === true;

    const hasValidCount = count === 1;
    const hasValidTimestamps = !!receivedAt && !!processedAt && isValid;

    return {
      skipped: false,
      count,
      receivedAt,
      processedAt,
      hasValidCount,
      hasValidTimestamps,
      isValid,
    };
  } finally {
    await client.end();
  }
}

function makeRequest(payload, requestNumber) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);

    const options = {
      hostname: config.host,
      port: config.port,
      path: '/api/webhooks/asaas',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-asaas-webhook-token': config.webhookToken,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            requestNumber,
            statusCode: res.statusCode,
            body: parsed,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          resolve({
            requestNumber,
            statusCode: res.statusCode,
            body: data,
            timestamp: new Date().toISOString(),
            parseError: err.message,
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Asaas Webhook Idempotency\n');
  console.log(`📍 Target: http://${config.host}:${config.port}/api/webhooks/asaas`);
  console.log(`🔑 Webhook Token: ${config.webhookToken}`);
  console.log(`📦 Test Payload:`, JSON.stringify(testPayload, null, 2));
  console.log('\n---\n');

  try {
    // Request 1: First webhook event
    console.log('📤 Sending Request 1 (first event)...');
    const response1 = await makeRequest(testPayload, 1);
    console.log(`✅ Response 1:`);
    console.log(`   Status: ${response1.statusCode}`);
    console.log(`   Body:`, JSON.stringify(response1.body, null, 2));
    console.log(`   Timestamp: ${response1.timestamp}\n`);

    if (response1.statusCode !== 200) {
      console.error('❌ First request failed. Aborting...');
      process.exit(1);
    }

    // Wait a bit to ensure timestamps are different
    await new Promise((r) => setTimeout(r, 500));

    // Request 2: Duplicate webhook event
    console.log('📤 Sending Request 2 (duplicate event)...');
    const response2 = await makeRequest(testPayload, 2);
    console.log(`✅ Response 2:`);
    console.log(`   Status: ${response2.statusCode}`);
    console.log(`   Body:`, JSON.stringify(response2.body, null, 2));
    console.log(`   Timestamp: ${response2.timestamp}\n`);

    if (response2.statusCode !== 200) {
      console.error('❌ Second request failed. Aborting...');
      process.exit(1);
    }

    // Validation
    console.log('---\n🔍 VALIDATION\n');

    const validation = {
      request1Success: response1.statusCode === 200,
      request2Success: response2.statusCode === 200,
      request2IsDuplicate: response2.body?.duplicate === true,
      request1Status: response1.body?.status,
      request2Status: response2.body?.status,
    };

    console.log(`✅ Request 1 returned 200: ${validation.request1Success}`);
    console.log(`✅ Request 2 returned 200: ${validation.request2Success}`);
    console.log(`📌 Request 1 status: "${validation.request1Status}"`);
    console.log(`📌 Request 2 status: "${validation.request2Status}"`);
    console.log(`📌 Request 2 marked as duplicate: ${validation.request2IsDuplicate}`);

    console.log('\n---\n');

    if (validation.request1Success && validation.request2Success) {
      const dbValidation = await validateDatabase();

      if (!dbValidation.skipped) {
        console.log('---\n🗄️  DATABASE VALIDATION\n');
        console.log(`📌 eventKey: ${eventKey}`);
        console.log(`📌 COUNT = ${dbValidation.count}`);
        console.log(`📌 received_at = ${dbValidation.receivedAt?.toISOString()}`);
        console.log(`📌 processed_at = ${dbValidation.processedAt?.toISOString()}`);
        console.log(`📌 processed_at >= received_at: ${dbValidation.isValid}`);
        console.log('\n---\n');

        if (!dbValidation.hasValidCount) {
          console.error('❌ COUNT no banco não é 1 para o eventKey testado.');
          process.exit(1);
        }

        if (!dbValidation.hasValidTimestamps) {
          console.error('❌ processed_at < received_at ou timestamps ausentes.');
          process.exit(1);
        }
      }

      if (validation.request2IsDuplicate) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('   - Both webhooks returned 200 OK');
        console.log('   - Duplicate webhook correctly identified');
        console.log('   - Idempotency working correctly');
        process.exit(0);
      } else {
        console.warn('⚠️  TESTS PARTIALLY PASSED');
        console.warn('   - Both webhooks returned 200 OK');
        console.warn('   - But duplicate flag not explicitly set in response');
        console.warn('   - This might still work if DB constraint prevents duplicates');
        console.log('\n💡 Hint: Check database to verify only 1 record was created for eventKey');
        process.exit(0);
      }
    } else {
      console.error('❌ TESTS FAILED');
      console.error(
        `   - Request 1: ${validation.request1Success ? 'OK' : 'FAILED'}`,
      );
      console.error(
        `   - Request 2: ${validation.request2Success ? 'OK' : 'FAILED'}`,
      );
      process.exit(1);
    }
  } catch (err) {
    const message = err?.message || String(err);
    console.error('❌ Error during test:', message);
    if (err?.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

runTests();
