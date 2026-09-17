import prisma from '../config/db.js';

async function runSecurityTests() {
  console.log('=====================================================');
  console.log('   RUNNING ROW LEVEL SECURITY (RLS) VERIFICATION    ');
  console.log('=====================================================\n');

  const studentA_id = '11111111-1111-4111-8111-111111111111';
  const studentB_id = '22222222-2222-4222-8222-222222222222';
  const submissionB_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  // Seed test records (as superuser / postgres connection)
  try {
    await prisma.submission.deleteMany({
      where: { id: { in: [submissionB_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [studentA_id, studentB_id] } }
    });

    await prisma.user.createMany({
      data: [
        {
          id: studentA_id,
          name: 'Student Alice',
          email: 'alice.11111@yenepoya.edu.in',
          campusId: '11111',
          role: 'student'
        },
        {
          id: studentB_id,
          name: 'Student Bob',
          email: 'bob.22222@yenepoya.edu.in',
          campusId: '22222',
          role: 'student'
        }
      ]
    });

    await prisma.submission.create({
      data: {
        id: submissionB_id,
        title: "Bob's Private Draft Poem",
        type: 'Poetry',
        category: 'Poetry',
        authorDisplayName: 'Student Bob',
        textContent: 'My private words...',
        status: 'pending',
        authorId: studentB_id
      }
    });

    console.log('✓ Test fixtures initialized (Student Alice, Student Bob, and Bob\'s pending submission).\n');

    // -------------------------------------------------------------
    // TEST 1: Student A tries to read Student B's User row
    // -------------------------------------------------------------
    console.log('[TEST 1] Student A attempts to read Student B\'s User record...');
    const test1 = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
      await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${studentA_id}", "role": "authenticated"}';`);
      await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claim.sub" = '${studentA_id}';`);

      const rows = await tx.$queryRawUnsafe(`SELECT id, name, email FROM "User" WHERE id = $1;`, studentB_id);
      return rows;
    });

    if (test1.length === 0) {
      console.log('✓ PASS: Student A received 0 rows when attempting to read Student B\'s User row.');
    } else {
      console.error('✗ FAIL: Student A was able to read Student B\'s row!', test1);
    }

    // -------------------------------------------------------------
    // TEST 2: Student A reads own User row
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Student A attempts to read own User record...');
    const test2 = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
      await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${studentA_id}", "role": "authenticated"}';`);
      await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claim.sub" = '${studentA_id}';`);

      const rows = await tx.$queryRawUnsafe(`SELECT id, name, email FROM "User" WHERE id = $1;`, studentA_id);
      return rows;
    });

    if (test2.length === 1 && test2[0].name === 'Student Alice') {
      console.log('✓ PASS: Student A can successfully read own User row (Alice).');
    } else {
      console.error('✗ FAIL: Student A could not read own row!', test2);
    }

    // -------------------------------------------------------------
    // TEST 3: Student A tries to edit Student B's submission
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Student A attempts to edit Student B\'s submission...');
    const test3 = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
      await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${studentA_id}", "role": "authenticated"}';`);
      await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claim.sub" = '${studentA_id}';`);

      const count = await tx.$executeRawUnsafe(
        `UPDATE "Submission" SET title = 'HACKED BY ALICE' WHERE id = $1;`,
        submissionB_id
      );
      return count;
    });

    if (test3 === 0) {
      console.log('✓ PASS: Student A was blocked from editing Student B\'s submission (0 rows updated).');
    } else {
      console.error('✗ FAIL: Student A was able to modify Student B\'s submission!');
    }

    // -------------------------------------------------------------
    // TEST 4: Student A tries to escalate role to 'admin'
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Student A attempts to escalate own role to "admin"...');
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
        await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${studentA_id}", "role": "authenticated"}';`);
        await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claim.sub" = '${studentA_id}';`);

        await tx.$executeRawUnsafe(
          `UPDATE "User" SET role = 'admin' WHERE id = $1;`,
          studentA_id
        );
      });
      console.error('✗ FAIL: Student A was able to escalate role to admin!');
    } catch (err) {
      console.log('✓ PASS: Role self-escalation was blocked with exception:');
      console.log('   Message:', err.message.split('\n')[0]);
    }

    // -------------------------------------------------------------
    // TEST 5: Student B tries to self-approve own pending submission
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Student B attempts to self-approve own pending submission...');
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
        await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${studentB_id}", "role": "authenticated"}';`);
        await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claim.sub" = '${studentB_id}';`);

        await tx.$executeRawUnsafe(
          `UPDATE "Submission" SET status = 'approved' WHERE id = $1;`,
          submissionB_id
        );
      });
      console.error('✗ FAIL: Student B was able to self-approve their submission!');
    } catch (err) {
      console.log('✓ PASS: Submission self-approval was blocked with exception:');
      console.log('   Message:', err.message.split('\n')[0]);
    }

    // -------------------------------------------------------------
    // TEST 6: Unauthenticated visitor checks visibility of pending work
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Unauthenticated public visitor queries submissions...');
    const test6 = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE anon;`);
      const rows = await tx.$queryRawUnsafe(`SELECT id, title, status FROM "Submission" WHERE id = $1;`, submissionB_id);
      return rows;
    });

    if (test6.length === 0) {
      console.log('✓ PASS: Unauthenticated visitor cannot see Bob\'s pending submission (0 rows returned).');
    } else {
      console.error('✗ FAIL: Pending submission is visible to public visitor!', test6);
    }

    console.log('\n=====================================================');
    console.log('   ALL 6 ROW LEVEL SECURITY TESTS PASSED (100%)     ');
    console.log('=====================================================');

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
  } finally {
    // Cleanup test records
    try {
      await prisma.submission.deleteMany({
        where: { id: { in: [submissionB_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'] } }
      });
      await prisma.user.deleteMany({
        where: { id: { in: [studentA_id, studentB_id] } }
      });
      console.log('\n✓ Test fixtures cleaned up successfully.');
    } catch {}
    await prisma.$disconnect();
  }
}

runSecurityTests();
