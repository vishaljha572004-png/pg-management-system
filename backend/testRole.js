import fetch from 'node-fetch';

const run = async () => {
  try {
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'admin2@test.com',
        phone: '9999999999',
        password: 'password123',
        role: 'admin'
      })
    });
    console.log("Register:", await regRes.text());

    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin2@test.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log("Login User:", loginData.user);

    const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${loginData.accessToken}` }
    });
    const profileData = await profileRes.json();
    console.log("Profile Role:", profileData.role);

  } catch(e) {
    console.log("Error:", e);
  }
};
run();
