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

async function apiRequest(endpoint, { method = 'GET', body = null, token = null, skipBypass = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (!skipBypass) {
    headers['x-test-suite'] = 'true';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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

  return { status: res.status, data, headers: res.headers };
}

async function runModerationTests() {
  console.log('====================================================');
  console.log(' Campus Canvas: Content Moderation & Reporting Tests');
  console.log('====================================================\n');

  // Setup test users & test piece
  let editor = await prisma.user.findFirst({ where: { role: 'editor' } });
  if (!editor) {
    editor = await prisma.user.create({
      data: {
        name: 'Lead Editor',
        email: 'editor.test@yenepoya.edu.in',
        role: 'editor'
      }
    });
  }

  let student = await prisma.user.findFirst({ where: { role: 'student' } });
  if (!student) {
    student = await prisma.user.create({
      data: {
        name: 'Report Test Student',
        email: 'report.student@yenepoya.edu.in',
        role: 'student'
      }
    });
  }

  const editorToken = jwt.sign(
    { id: editor.id, email: editor.email, role: 'editor' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: student.id, email: student.email, role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Create or find an approved submission for testing
  let testPiece = await prisma.submission.findFirst({
    where: { status: 'approved' }
  });

  if (!testPiece) {
    testPiece = await prisma.submission.create({
      data: {
        title: 'Solitude by the Netravati',
        type: 'Poetry',
        category: 'Free Verse',
        authorDisplayName: 'Coastal Bard',
        textContent: 'Gentle waves kiss the sandy shore,\nStories untold forevermore.',
        status: 'approved',
        authorId: student.id
      }
    });
  }

  console.log(`Using test piece: "${testPiece.title}" (ID: ${testPiece.id})`);

  // 1. Missing reason in report
  console.log('\n1. Testing rejection of report with missing reason...');
  const res1 = await apiRequest(`/submissions/${testPiece.id}/report`, {
    method: 'POST',
    body: { details: 'Some concern' }
  });
  assert(res1.status === 400 && res1.data?.error?.includes('reason'), 
    `Rejected missing reason with 400: "${res1.data?.error}"`);

  // 2. Invalid reason enum
  console.log('\n2. Testing rejection of report with invalid reason enum...');
  const res2 = await apiRequest(`/submissions/${testPiece.id}/report`, {
    method: 'POST',
    body: { reason: 'I just do not like it', details: 'Subjective distaste' }
  });
  assert(res2.status === 400 && res2.data?.error?.includes('Report reason must be one of'),
    `Rejected invalid reason enum with 400: "${res2.data?.error}"`);

  // 3. Oversized details (> 1,000 characters)
  console.log('\n3. Testing rejection of oversized report details (>1,000 chars)...');
  const res3 = await apiRequest(`/submissions/${testPiece.id}/report`, {
    method: 'POST',
    body: {
      reason: 'Copyright / Plagiarism',
      details: 'A'.repeat(1005)
    }
  });
  assert(res3.status === 400 && res3.data?.error?.includes('1,000 characters'),
    `Rejected oversized details with 400: "${res3.data?.error}"`);

  // 4. Malformed reporter email
  console.log('\n4. Testing rejection of malformed reporter email...');
  const res4 = await apiRequest(`/submissions/${testPiece.id}/report`, {
    method: 'POST',
    body: {
      reason: 'Harassment',
      details: 'Unkind remarks in poem',
      reporterEmail: 'not-an-email'
    }
  });
  assert(res4.status === 400 && res4.data?.error?.includes('valid contact email'),
    `Rejected invalid email with 400: "${res4.data?.error}"`);

  // 5. Valid report submission
  console.log('\n5. Testing creation of valid submission report...');
  const res5 = await apiRequest(`/submissions/${testPiece.id}/report`, {
    method: 'POST',
    body: {
      reason: 'Copyright / Plagiarism',
      details: 'This poem appears closely modeled after an existing published verse.',
      reporterEmail: 'concerned.reader@yenepoya.edu.in'
    }
  });
  assert(res5.status === 201 && res5.data?.report?.id,
    `Successfully created report with 201: ID ${res5.data?.report?.id}`);
  const createdReportId = res5.data?.report?.id;

  // 6. Security: Non-editor cannot access moderation queue (401 / 403)
  console.log('\n6. Testing unauthorized access to GET /api/reports...');
  const unauthRes = await apiRequest('/reports', { method: 'GET' });
  assert(unauthRes.status === 401, `Unauthenticated request rejected with 401 (Got: ${unauthRes.status})`);

  const studentRes = await apiRequest('/reports', { method: 'GET', token: studentToken });
  assert(studentRes.status === 403, `Student access to moderation queue rejected with 403 (Got: ${studentRes.status})`);

  // 7. Editor moderation queue access
  console.log('\n7. Testing editor access to GET /api/reports and counts...');
  const editorReportsRes = await apiRequest('/reports?status=pending', {
    method: 'GET',
    token: editorToken
  });
  assert(editorReportsRes.status === 200 && Array.isArray(editorReportsRes.data?.reports),
    `Editor retrieved pending reports array (Count: ${editorReportsRes.data?.reports?.length})`);
  assert(editorReportsRes.data?.counts?.pending >= 1,
    `Counts properly tracked: ${JSON.stringify(editorReportsRes.data?.counts)}`);

  // 8. Editor inspection of piece with reports in getSubmissionById
  console.log('\n8. Testing that getSubmissionById includes reports for editors...');
  const pieceDetailRes = await apiRequest(`/submissions/${testPiece.id}`, {
    method: 'GET',
    token: editorToken
  });
  const reportsOnPiece = pieceDetailRes.data?.submission?.reports;
  assert(Array.isArray(reportsOnPiece) && reportsOnPiece.length > 0,
    `Editor receives active reports attached to submission (Count: ${reportsOnPiece?.length})`);

  // 9. Editor status resolution (PATCH /api/reports/:id -> resolved)
  console.log('\n9. Testing editor marking report as resolved...');
  const resolveRes = await apiRequest(`/reports/${createdReportId}`, {
    method: 'PATCH',
    token: editorToken,
    body: { status: 'resolved' }
  });
  assert(resolveRes.status === 200 && resolveRes.data?.report?.status === 'resolved',
    `Report status successfully updated to "resolved" by editor: ${resolveRes.data?.report?.resolvedBy?.name}`);

  // 10. Editor status dismissal (PATCH /api/reports/:id -> dismissed)
  console.log('\n10. Testing editor marking report as dismissed...');
  const dismissRes = await apiRequest(`/reports/${createdReportId}`, {
    method: 'PATCH',
    token: editorToken,
    body: { status: 'dismissed' }
  });
  assert(dismissRes.status === 200 && dismissRes.data?.report?.status === 'dismissed',
    `Report status successfully updated to "dismissed"`);

  // Clean up test report
  if (createdReportId) {
    await prisma.report.delete({ where: { id: createdReportId } }).catch(() => {});
  }

  // 11. Testing general website issue / suggestion creation (POST /api/reports/general)
  console.log('\n11. Testing creation of general website suggestion / bug report...');
  const genRes1 = await apiRequest('/reports/general', {
    method: 'POST',
    body: {
      reason: 'Feature Suggestion',
      subject: 'Dark mode for night reading',
      details: 'It would be wonderful to have a toggleable dark mode when reading literary prose late at night.',
      reporterEmail: 'suggesting.student@yenepoya.edu.in'
    }
  });
  assert(genRes1.status === 201 && genRes1.data?.report?.id,
    `Successfully created general website suggestion with 201: ID ${genRes1.data?.report?.id}`);
  const generalReportId = genRes1.data?.report?.id;

  // 12. Testing validation on general feedback (too short details)
  console.log('\n12. Testing validation on general feedback (< 5 chars details)...');
  const genRes2 = await apiRequest('/reports/general', {
    method: 'POST',
    body: {
      reason: 'Bug / Functional Issue',
      details: 'bad'
    }
  });
  assert(genRes2.status === 400 && genRes2.data?.error?.includes('at least 5 characters'),
    `Rejected brief feedback with 400: "${genRes2.data?.error}"`);

  // 13. Testing editor retrieval of general feedback in moderation queue
  console.log('\n13. Testing editor retrieval of general feedback in queue...');
  const genQueueRes = await apiRequest('/reports?type=suggestion', {
    method: 'GET',
    token: editorToken
  });
  assert(genQueueRes.status === 200 && genQueueRes.data?.counts?.generalPending >= 1,
    `General suggestions tracked in moderation queue (generalPending: ${genQueueRes.data?.counts?.generalPending})`);

  // Clean up general test report
  if (generalReportId) {
    await prisma.report.delete({ where: { id: generalReportId } }).catch(() => {});
  }

  console.log('\n====================================================');
  console.log(` Moderation Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runModerationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
