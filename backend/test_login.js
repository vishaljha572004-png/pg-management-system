import axios from 'axios';

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/super-admin/login', {
      email: 'superadmin@pg.com',
      password: 'superadmin123'
    });
    console.log("Success:", res.data);
  } catch (error) {
    console.error("Error Status:", error.response?.status);
    console.error("Error Data:", error.response?.data);
  }
}
testLogin();
