import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wait, I will use manual cookie parsing or add cookie-parser.
// Let's add cookie-parser dynamically. Or I can just parse cookies manually, but better to use cookie-parser.
// Let me write the standard server.js first.

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Important: configure CORS to allow credentials for cookies
app.use(cors({
  origin: ['http://localhost:5173', 'https://pg-management-system-84bq.vercel.app', process.env.FRONTEND_URL],
  credentials: true
}));
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow cross origin resource sharing for images
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// For reading HTTP-only cookies
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      req.cookies[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  next();
});

// Routes
import authRoutes from './src/routes/authRoutes.js';
import studentRoutes from './src/routes/studentRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import roomRoutes from './src/routes/roomRoutes.js';
import rentRoutes from './src/routes/rentRoutes.js';
import electricityRoutes from './src/routes/electricityRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import noticeRoutes from './src/routes/noticeRoutes.js';
import complaintRoutes from './src/routes/complaintRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import superAdminRoutes from './src/routes/superAdminRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/electricity', electricityRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('PG Management API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
