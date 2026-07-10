// Using global fetch

async function runTests() {
  const baseURL = 'http://localhost:5000/api';

  console.log('Testing Student Registration...');
  let studentEmail = `student${Date.now()}@test.com`;
  try {
    const res = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: studentEmail,
        phone: `9${Math.floor(Math.random() * 1000000000)}`,
        password: 'password123',
        role: 'Admin'
      })
    });
    const data = await res.json();
    if (res.ok) console.log('✅ Student Registered successfully');
    else console.error('❌ Student Registration failed:', data);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('Testing Admin Login with Student credentials...');
  try {
    const res = await fetch(`${baseURL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: 'password123' })
    });
    const data = await res.json();
    if (res.ok) console.log('❌ Failed: Student was able to login to Admin portal');
    else console.log('✅ Passed: Student rejected from Admin login:', data.message);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('Testing Super Admin Login...');
  try {
    const res = await fetch(`${baseURL}/auth/super-admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@pg.com', password: 'superadmin123' })
    });
    const data = await res.json();
    if (res.ok) {
        console.log('✅ Passed: Super Admin login successful, role:', data.user.role);
        
        const token = data.accessToken;
        console.log('Testing Create Admin API...');
        const createRes = await fetch(`${baseURL}/super-admin/admins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                name: 'Test Admin',
                email: `admin${Date.now()}@test.com`,
                phone: `8${Math.floor(Math.random() * 1000000000)}`,
                password: 'adminpassword'
            })
        });
        const createData = await createRes.json();
        if (createRes.ok) console.log('✅ Passed: Admin created by Super Admin');
        else console.error('❌ Admin creation failed:', createData);
    } else {
        console.error('❌ Super Admin login failed:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

runTests();
