const api = async (path, body) => {
  const res = await fetch(`http://localhost:5000/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(JSON.stringify(await res.json()));
  }
  return res.json();
};

let adminToken = '';
let studentToken = '';

async function run() {
  try {
    console.log('1. Admin Signup');
    try {
      await api('/auth/register', { name: 'Admin User', email: 'admin@pg.com', phone: '0000000000', password: 'password123', role: 'admin' });
    } catch (e) {
      console.log('Admin already exists, skipping signup');
    }

    console.log('2. Admin Login');
    const adminRes = await api('/auth/login', { email: 'admin@pg.com', password: 'password123' });
    adminToken = adminRes.accessToken;
    console.log('Admin Token Received');

    console.log('3. Student Signup');
    const studentEmail = `student${Date.now()}@test.com`;
    await api('/auth/register', { name: 'Test Student', email: studentEmail, phone: `${Date.now()}`.slice(0, 10), password: 'password123', role: 'student' });
    
    console.log('4. Student Login');
    const studentRes = await api('/auth/login', { email: studentEmail, password: 'password123' });
    studentToken = studentRes.accessToken;
    console.log('Student Token Received');
    
    console.log('E2E simulation completed successfully!');
  } catch (error) {
    console.error('Simulation Failed:', error.message);
    process.exit(1);
  }
}

run();
