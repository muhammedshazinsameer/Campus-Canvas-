import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const API_BASE = 'http://localhost:5000/api';
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

async function apiRequest(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = { 
    'Content-Type': 'application/json',
    'x-test-suite': 'true'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response
  }

  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log(' Campus Canvas: Comprehensive Validation & Security Tests');
  console.log('====================================================\n');

  // Find or create test student user in DB
  const testStudentEmail = 'sec.test.student@yenepoya.edu.in';
  let studentUser = await prisma.user.findUnique({ where: { email: testStudentEmail } });
  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        name: 'Sec Test Student',
        email: testStudentEmail,
        campusId: 'sectest',
        role: 'student'
      }
    });
  }

  // Find or create test editor user in DB
  let editorUser = await prisma.user.findFirst({ where: { role: 'editor' } });
  if (!editorUser) {
    editorUser = await prisma.user.create({
      data: {
        name: 'Editorial Board',
        email: 'editor@campuscanvas.org',
        campusId: 'editor',
        role: 'editor'
      }
    });
  }

  // Generate valid test JWT tokens linked to real DB users
  const studentToken = jwt.sign(
    { id: studentUser.id, email: studentUser.email, role: studentUser.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const editorToken = jwt.sign(
    { id: editorUser.id, email: editorUser.email, role: editorUser.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // TEST 1: Rejection of missing title
  console.log('1. Testing missing title in submission creation...');
  const res1 = await apiRequest('/submissions', {
    method: 'POST',
    token: studentToken,
    body: {
      title: '',
      type: 'Poetry',
      authorDisplayName: 'Author One',
      textContent: 'A short poem about nature.'
    }
  });
  assert(res1.status === 400, `Rejected empty title with 400 (Got: ${res1.status}, Error: "${res1.data?.error}")`);

  // TEST 2: Rejection of oversized title (>150 characters)
  console.log('\n2. Testing oversized title (>150 chars)...');
  const res2 = await apiRequest('/submissions', {
    method: 'POST',
    token: studentToken,
    body: {
      title: 'A'.repeat(151),
      type: 'Poetry',
      authorDisplayName: 'Author One',
      textContent: 'A short poem.'
    }
  });
  assert(res2.status === 400 && res2.data?.error?.includes('150'), 
    `Rejected oversized title with 400: "${res2.data?.error}"`);

  // TEST 3: Rejection of invalid piece type
  console.log('\n3. Testing invalid piece type enum...');
  const res3 = await apiRequest('/submissions', {
    method: 'POST',
    token: studentToken,
    body: {
      title: 'Valid Title Here',
      type: 'MaliciousExecutable',
      authorDisplayName: 'Author One',
      textContent: 'Some text here.'
    }
  });
  assert(res3.status === 400 && res3.data?.error?.includes('Piece type must be one of'), 
    `Rejected invalid type with 400: "${res3.data?.error}"`);

  // TEST 4: Rejection of oversized author name (>80 characters)
  console.log('\n4. Testing oversized author display name (>80 chars)...');
  const res4 = await apiRequest('/submissions', {
    method: 'POST',
    token: studentToken,
    body: {
      title: 'Valid Title',
      type: 'Poetry',
      authorDisplayName: 'X'.repeat(81),
      textContent: 'A short poem.'
    }
  });
  assert(res4.status === 400 && res4.data?.error?.includes('80'), 
    `Rejected oversized author name with 400: "${res4.data?.error}"`);

  // TEST 5: Rejection of excessive tags (>10 tags)
  console.log('\n5. Testing excessive tags (>10 tags)...');
  const res5 = await apiRequest('/submissions', {
    method: 'POST',
    token: studentToken,
    body: {
      title: 'Valid Title',
      type: 'Poetry',
      authorDisplayName: 'Author One',
      textContent: 'A short poem.',
      tags: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11']
    }
  });
  assert(res5.status === 400 && res5.data?.error?.includes('10'), 
    `Rejected excessive tags with 400: "${res5.data?.error}"`);

  // TEST 6: Rejection of invalid tag characters (e.g. <script>)
  console.log('\n6. Testing malicious tag characters...');
  const res6 = await apiRequest('/submissions', {
    method: 'POST',
    token: studentToken,
    body: {
      title: 'Valid Title',
      type: 'Poetry',
      authorDisplayName: 'Author One',
      textContent: 'A short poem.',
      tags: ['<script>alert(1)</script>']
    }
  });
  assert(res6.status === 400, `Rejected malicious characters in tag with 400: "${res6.data?.error}"`);

  // TEST 7: Successful creation of a valid piece with sanitized inputs
  console.log('\n7. Testing creation of valid sanitized piece...');
  let createdPieceId = null;
  const res7 = await apiRequest('/submissions', {
    method: 'POST',
    token: studentToken,
    body: {
      title: 'The Whispering Pines of Mangalore',
      type: 'Poetry',
      category: 'Free Verse',
      authorDisplayName: 'A. K. Ramanujan Fellow',
      textContent: 'Soft winds drift through coastal trees,\nEchoing songs across the seas.',
      tags: ['coastal', 'nature', 'poetry']
    }
  });
  assert(res7.status === 201 && res7.data.submission?.id, 
    `Successfully created piece with status 201: ID ${res7.data.submission?.id}`);
  assert(res7.data.submission?.status === 'pending', `Piece status is strictly set to "pending"`);
  createdPieceId = res7.data.submission?.id;

  // TEST 8: Rejection of oversized editor comment (>2000 chars)
  if (createdPieceId) {
    console.log('\n8. Testing oversized editor comment (>2,000 chars)...');
    const res8 = await apiRequest(`/submissions/${createdPieceId}/review`, {
      method: 'PATCH',
      token: editorToken,
      body: {
        status: 'approved',
        editorComment: 'E'.repeat(2001)
      }
    });
    assert(res8.status === 400 && res8.data?.error?.includes('2,000'), 
      `Rejected oversized comment with 400: "${res8.data?.error}"`);

    // TEST 9: Successful review with valid comment
    console.log('\n9. Testing valid editorial review and approval...');
    const res9 = await apiRequest(`/submissions/${createdPieceId}/review`, {
      method: 'PATCH',
      token: editorToken,
      body: {
        status: 'approved',
        editorComment: 'Superb control of meter and evocative local imagery.'
      }
    });
    console.log('    Debug res9:', res9.status, res9.data);
    assert(res9.status === 200 && res9.data.submission?.status === 'approved', 
      `Piece successfully approved with status: ${res9.data?.submission?.status || res9.data?.error || res9.status}`);
  }

  // TEST 10: Google OAuth domain restriction
  console.log('\n10. Testing Google OAuth Yenepoya domain restriction on /api/auth/google...');
  const res10 = await apiRequest('/auth/google', {
    method: 'POST',
    body: {
      email: 'hacker@gmail.com',
      name: 'External Hacker'
    }
  });
  assert(res10.status === 403, 
    `Rejected non-college domain with 403 Forbidden: "${res10.data?.error}"`);

  // TEST 11: Valid college email acceptance on /api/auth/google
  console.log('\n11. Testing Google OAuth acceptance for @yenepoya.edu.in...');
  const res11 = await apiRequest('/auth/google', {
    method: 'POST',
    body: {
      email: 'verified.student@yenepoya.edu.in',
      name: 'Verified Student'
    }
  });
  assert(res11.status === 200 && res11.data.success === true, 
    `Accepted Yenepoya email successfully: issued token for ${res11.data.user?.email}`);

  // TEST 12: Search query length limit (>100 chars rejected)
  console.log('\n12. Testing query parameter length limit (>100 chars in search)...');
  const res12 = await apiRequest(`/submissions?search=${'s'.repeat(101)}`);
  assert(res12.status === 400, `Rejected oversized search query with 400 Bad Request: "${res12.data?.error}"`);

  // Cleanup test pieces
  if (createdPieceId) {
    try {
      await apiRequest(`/submissions/${createdPieceId}`, {
        method: 'DELETE',
        token: editorToken
      });
    } catch {
      // Ignore cleanup error
    }
  }
  await prisma.user.deleteMany({
    where: { email: { in: [testStudentEmail, 'verified.student@yenepoya.edu.in'] } }
  }).catch(() => {});

  await prisma.$disconnect();

  console.log('\n====================================================');
  console.log(` Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
