import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  try {
    const payload = {
      id: 1, 
      role: 'admin'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret');
    
    const roomsRes = await fetch('http://localhost:5000/api/rooms', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const roomsData = await roomsRes.json();
    console.log("Rooms Status:", roomsRes.status);
    console.log("Rooms:", roomsData);

    const studentsRes = await fetch('http://localhost:5000/api/rooms/unassigned-students', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const studentsData = await studentsRes.json();
    console.log("Students Status:", studentsRes.status);
    console.log("Students:", studentsData);
  } catch(e) {
    console.log("Error:", e);
  }
};
run();
