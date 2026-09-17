// Automated test to verify all prompt requirements and security rules
async function runTests() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('--- Starting Campus Canvas Backend Security & API Tests ---');

  // Test 1: Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  const healthData = await healthRes.json();
  console.log('✓ Health check passed:', healthData.service);

  // Test 2: Unauthenticated GET /api/submissions - Public can view approved works
  const publicRes = await fetch(`${baseUrl}/submissions`);
  const publicData = await publicRes.json();
  const nonApproved = publicData.submissions.filter(s => s.status !== 'approved');
  if (nonApproved.length > 0) {
    throw new Error(`Security violation: Non-approved submissions returned to public! Found: ${nonApproved.length}`);
  }
  console.log(`✓ Rule 1 passed: Everyone can view approved works (${publicData.submissions.length} approved items returned)`);

  // Test 3: Unauthenticated POST /api/submissions MUST be blocked
  const unauthSubRes = await fetch(`${baseUrl}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Anonymous Project',
      type: 'Poetry',
      authorDisplayName: 'Guest'
    })
  });
  if (unauthSubRes.status !== 401) {
    throw new Error(`Security violation: Unauthenticated submission was NOT blocked with 401! Got HTTP ${unauthSubRes.status}`);
  }
  console.log('✓ Rule 2 passed: Unauthenticated submission blocked with HTTP 401 (Only signed in students can submit)');

  // Test 4: Student registration with non-Yenepoya email MUST fail
  const badRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'External Student',
      email: 'student@gmail.com',
      password: 'password123',
      role: 'student'
    })
  });
  if (badRegRes.status !== 400) {
    throw new Error('Security violation: Non-Yenepoya email was allowed for student registration!');
  }
  const badRegData = await badRegRes.json();
  console.log('✓ Rule 3 passed: Non-Yenepoya email rejected with message:', badRegData.error);

  // Test 5: Student registration with valid Yenepoya email MUST succeed
  const testCampusId = `test${Date.now()}@yenepoya.edu.in`;
  const goodRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Yenepoya Scholar',
      email: testCampusId,
      password: 'password123',
      role: 'student'
    })
  });
  const goodRegData = await goodRegRes.json();
  if (goodRegRes.status !== 201 || !goodRegData.token) {
    throw new Error('Valid Yenepoya registration failed: ' + JSON.stringify(goodRegData));
  }
  console.log(`✓ Rule 4 passed: Valid Yenepoya email (${testCampusId}) registered successfully`);

  // Test 6: Seed student login (13243@yenepoya.edu.in)
  const studentLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '13243@yenepoya.edu.in',
      password: 'student123'
    })
  });
  const studentLoginData = await studentLoginRes.json();
  if (studentLoginRes.status !== 200 || !studentLoginData.token) {
    throw new Error('Seed student login failed: ' + JSON.stringify(studentLoginData));
  }
  const studentToken = studentLoginData.token;
  console.log('✓ Rule 5 passed: Seed student (13243@yenepoya.edu.in) logged in successfully');

  // Test 7: Authenticated student creates a project submission
  const studentSubRes = await fetch(`${baseUrl}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      title: 'Monsoon in Mangalore',
      type: 'Poetry',
      category: 'Campus Verse',
      authorDisplayName: 'Yenepoya Campus Bard',
      textContent: 'Raindrops kiss the medical quadrangle stones,\nSummer heat disperses into mist.',
      tags: ['monsoon', 'campus', 'yenepoya']
    })
  });
  const studentSubData = await studentSubRes.json();
  if (studentSubRes.status !== 201 || studentSubData.submission.status !== 'pending') {
    throw new Error('Authenticated student submission failed: ' + JSON.stringify(studentSubData));
  }
  const createdId = studentSubData.submission.id;
  console.log(`✓ Rule 6 passed: Signed-in student successfully submitted project (Status: ${studentSubData.submission.status}, ID: ${createdId})`);

  // Test 8: Public cannot see the newly created pending submission
  const checkPublicRes = await fetch(`${baseUrl}/submissions/${createdId}`);
  if (checkPublicRes.status !== 404) {
    throw new Error('Security violation: Pending student project was publicly accessible!');
  }
  console.log('✓ Rule 7 passed: Public cannot access pending student project before review');

  // Test 9: Editor logs in and approves the project
  const editorLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'editor@campuscanvas.org',
      password: 'editor123'
    })
  });
  const editorLoginData = await editorLoginRes.json();
  const editorToken = editorLoginData.token;

  const reviewRes = await fetch(`${baseUrl}/submissions/${createdId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${editorToken}`
    },
    body: JSON.stringify({
      status: 'approved',
      editorComment: 'Evocative imagery capturing coastal campus rain.'
    })
  });
  const reviewData = await reviewRes.json();
  if (reviewData.submission.status !== 'approved') {
    throw new Error('Editor review failed!');
  }
  console.log('✓ Rule 8 passed: Editor approved student project with Editor\'s Note');

  // Test 10: Now public can view the approved piece!
  const publicViewRes = await fetch(`${baseUrl}/submissions/${createdId}`);
  const publicViewData = await publicViewRes.json();
  if (publicViewRes.status !== 200 || !publicViewData.submission.editorComment) {
    throw new Error('Approved project is not publicly visible!');
  }
  console.log('✓ Rule 9 passed: Approved student project is now publicly visible to everyone!');

  // Cleanup test submission
  await fetch(`${baseUrl}/submissions/${createdId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${editorToken}` }
  });
  console.log('✓ Cleaned up test submission');

  console.log('\n=========================================');
  console.log('ALL CAMPUS CANVAS RULES (STUDENT AUTH + YENEPOYA MAIL) PASSED 100%!');
  console.log('=========================================');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
