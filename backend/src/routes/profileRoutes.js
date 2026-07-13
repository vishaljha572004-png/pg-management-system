import express from 'express';
import { getMyProfile, updateProfile } from '../controllers/profileController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'doc-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.use(verifyToken);

router.get('/my-profile', getMyProfile);

router.post('/update', upload.fields([
  { name: 'aadhaar_front', maxCount: 1 },
  { name: 'aadhaar_back', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
  { name: 'college_id_doc', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'police_document', maxCount: 1 }
]), updateProfile);

export default router;
