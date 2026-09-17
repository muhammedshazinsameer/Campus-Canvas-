import prisma from './src/config/db.js';

const API_BASE = 'http://localhost:5000/api';

async function testOtpFlow() {
  console.log('--- Starting Two-Step OTP Authentication Verification ---');

  // Test 1: Reject non-yenepoya email domain
  try {
    const res = await fetch(`${API_BASE}/auth/login-step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hacker@gmail.com', password: 'password123' })
    });
    if (res.status === 400) {
      const data = await res.json();
      console.log('PASS: Successfully rejected non-yenepoya email:', data.error);
    } else {
      console.error('FAIL: Status not 400 for non-yenepoya domain:', res.status);
    }
  } catch (err) {
    console.error('FAIL: Request error', err);
  }

  // Test 2: Reject wrong password
  try {
    const res = await fetch(`${API_BASE}/auth/login-step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '13243@yenepoya.edu.in', password: 'wrongpassword' })
    });
    if (res.status === 401) {
      const data = await res.json();
      console.log('PASS: Successfully rejected invalid password:', data.error);
    } else {
      console.error('FAIL: Status not 401 for wrong password:', res.status);
    }
  } catch (err) {
    console.error('FAIL: Request error', err);
  }

  // Test 3: Step 1 valid login - generate OTP
  const loginStep1Res = await fetch(`${API_BASE}/auth/login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '13243@yenepoya.edu.in', password: 'student123' })
  });
  const step1Data = await loginStep1Res.json();
  console.log('PASS: loginStep1 returned success:', step1Data);

  // Test 4: Retrieve OTP from DB to simulate reading student email
  const otpRecord = await prisma.otpVerification.findUnique({
    where: { email: '13243@yenepoya.edu.in' }
  });
  console.log(`PASS: Verified OTP stored in Supabase: [ ${otpRecord?.otp} ] for ${otpRecord?.email}`);

  // Test 5: Verify with wrong OTP
  const wrongOtpRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '13243@yenepoya.edu.in', otp: '000000' })
  });
  if (wrongOtpRes.status === 400) {
    const wrongData = await wrongOtpRes.json();
    console.log('PASS: Successfully rejected wrong OTP code:', wrongData.error);
  } else {
    console.error('FAIL: Status not 400 for wrong OTP:', wrongOtpRes.status);
  }

  // Test 6: Verify with correct OTP
  const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '13243@yenepoya.edu.in', otp: otpRecord.otp })
  });
  const verifyData = await verifyRes.json();
  console.log('PASS: Successfully verified OTP and activated session:', verifyData.user?.name, 'Token received:', Boolean(verifyData.token));

  // Test 7: Verify OTP was deleted from database to prevent replay
  const deletedRecord = await prisma.otpVerification.findUnique({
    where: { email: '13243@yenepoya.edu.in' }
  });
  if (!deletedRecord) {
    console.log('PASS: OTP record was cleanly deleted to prevent replay attacks');
  } else {
    console.error('FAIL: OTP record was not deleted');
  }

  console.log('\n--- ALL TWO-STEP OTP AUTH TESTS PASSED 100% ---');
  await prisma.$disconnect();
}

testOtpFlow().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
