const run = async () => {
  try {
    const baseURL = 'http://localhost:5000/api';
    
    // Login as admin
    let res = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@pg.com', password: 'password123' })
    });
    let data = await res.json();
    const token = data.token;

    // Fetch all students
    res = await fetch(`${baseURL}/admin/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const students = await res.json();
    console.log(students);
    process.exit(0);
  } catch (err) {
    console.error('API Error:', err);
    process.exit(1);
  }
};
run();
