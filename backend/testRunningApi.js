import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const run = async () => {
  try {
    const payload = {
      id: 1, 
      role: 'admin'
    };
    const secret = 'super_secret_access_key_2026';
    const token = jwt.sign(payload, secret);
    
    console.log("Token:", token);

    const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Profile Status:", profileRes.status);
    const profileData = await profileRes.json();
    console.log("Profile Data:", profileData);

  } catch(e) {
    console.log("Error:", e);
  }
};
run();
