import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const API_BASE = 'http://localhost:5000/api';
const ROOT_BASE = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'campus_canvas_fallback_secret_key';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runNetworkSecurityTests() {
  console.log('====================================================');
  console.log(' Campus Canvas: Network & Backend Security Tests');
  console.log('====================================================\n');

  // 1. Security Headers via Helmet
  console.log('1. Testing Helmet Security Headers on API responses...');
  const healthRes = await fetch(`${API_BASE}/health`);
  const headers = healthRes.headers;

  const csp = headers.get('content-security-policy');
  assert(Boolean(csp), `Content-Security-Policy header present: "${csp?.slice(0, 45)}..."`);

  const xFrameOptions = headers.get('x-frame-options');
  assert(xFrameOptions === 'DENY', `X-Frame-Options is strictly "DENY" (Got: "${xFrameOptions}")`);

  const xContentType = headers.get('x-content-type-options');
  assert(xContentType === 'nosniff', `X-Content-Type-Options is strictly "nosniff" (Got: "${xContentType}")`);

  const referrerPolicy = headers.get('referrer-policy');
  assert(referrerPolicy === 'strict-origin-when-cross-origin', 
    `Referrer-Policy is "strict-origin-when-cross-origin" (Got: "${referrerPolicy}")`);

  const corp = headers.get('cross-origin-resource-policy');
  assert(corp === 'cross-origin', `Cross-Origin-Resource-Policy allows safe cross-origin media loading (Got: "${corp}")`);

  // 2. CORS: Authorized vs Unauthorized Origins (No Wildcards)
  console.log('\n2. Testing CORS Whitelist Enforcement (No Wildcard *)...');

  // Test authorized frontend origin
  const authCorsRes = await fetch(`${API_BASE}/health`, {
    headers: { Origin: 'http://localhost:5173' }
  });
  const allowOrigin = authCorsRes.headers.get('access-control-allow-origin');
  assert(allowOrigin === 'http://localhost:5173', 
    `Allowed origin "http://localhost:5173" receives Access-Control-Allow-Origin (Got: "${allowOrigin}")`);

  // Test unauthorized / malicious origin
  const unauthCorsRes = await fetch(`${API_BASE}/health`, {
    headers: { Origin: 'https://evil-unauthorized-site.com' }
  });
  const unauthAllowOrigin = unauthCorsRes.headers.get('access-control-allow-origin');
  assert(!unauthAllowOrigin || unauthCorsRes.status === 403, 
    `Unauthorized origin "https://evil-unauthorized-site.com" is blocked by CORS (Status: ${unauthCorsRes.status}, AllowOrigin: ${unauthAllowOrigin})`);

  // 3. Rate Limiting on Submission Endpoints (RateLimit headers & limits)
  console.log('\n3. Testing Rate Limiting Headers on POST /api/submissions...');
  let studentUser = await prisma.user.findFirst({ where: { role: 'student' } });
  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        name: 'Rate Test Student',
        email: 'rate.student@yenepoya.edu.in',
        campusId: 'ratetest',
        role: 'student'
      }
    });
  }

  const studentToken = jwt.sign(
    { id: studentUser.id, email: studentUser.email, role: studentUser.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const subRes = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      title: 'Valid Submission Rate Limit Test',
      type: 'Poetry',
      authorDisplayName: 'Test Poet',
      textContent: 'Just a line of poetry for testing headers.'
    })
  });

  const rateLimitLimit = subRes.headers.get('ratelimit-limit');
  const rateLimitRemaining = subRes.headers.get('ratelimit-remaining');

  assert(Boolean(rateLimitLimit) && parseInt(rateLimitLimit, 10) === 10, 
    `RateLimit-Limit correctly configured to 10 submissions/hour (Got: ${rateLimitLimit})`);
  assert(rateLimitRemaining !== null, 
    `RateLimit-Remaining header actively tracked (Remaining: ${rateLimitRemaining})`);

  // Clean up created submission if created
  if (subRes.status === 201) {
    const data = await subRes.json();
    if (data.submission?.id) {
      await prisma.submission.delete({ where: { id: data.submission.id } }).catch(() => {});
    }
  }

  // 4. Sanitized Error Responses (No stack traces, internal IDs, or DB details)
  console.log('\n4. Testing Sanitization of API Error Responses...');
  const notFoundRes = await fetch(`${API_BASE}/nonexistent-route-for-testing`);
  const notFoundBody = await notFoundRes.json();
  assert(notFoundRes.status === 404 && notFoundBody.error && !notFoundBody.stack && !notFoundBody.details, 
    `404 response is cleanly sanitized: "${notFoundBody.error}"`);

  console.log('\n====================================================');
  console.log(` Network Security Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runNetworkSecurityTests().catch((err) => {
  console.error('Fatal network test error:', err);
  process.exit(1);
});
