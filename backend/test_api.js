async function testApi() {
  try {
    // 1. Login as admin
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admin.com', password: 'admin' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(JSON.stringify(loginData));

    const token = loginData.token;
    console.log('Logged in as admin. Token:', token.substring(0, 20) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test Reports Analytics
    console.log('Testing /api/reports/finance');
    const financeRes = await fetch('http://localhost:5000/api/reports/finance', { headers });
    const financeData = await financeRes.json();
    console.log('Finance OK:', financeRes.ok, financeData);

    console.log('Testing /api/reports/occupancy');
    const occRes = await fetch('http://localhost:5000/api/reports/occupancy', { headers });
    const occData = await occRes.json();
    console.log('Occupancy OK:', occRes.ok, occData);

    console.log('Testing /api/reports/complaints');
    const compRes = await fetch('http://localhost:5000/api/reports/complaints', { headers });
    const compData = await compRes.json();
    console.log('Complaints OK:', compRes.ok, compData);

  } catch (err) {
    console.error('ERROR IN API TEST:');
    console.error(err.message);
    process.exit(1);
  }
  process.exit(0);
}

testApi();
