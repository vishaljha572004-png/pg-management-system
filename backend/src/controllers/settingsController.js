import pool from '../config/db.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const getSettings = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    
    
    if (!pg_id) {
       return res.json({ pg_name: '', upi_id: '', account_name: '', qr_image_url: null });
    }

    const [rows] = await pool.execute('SELECT name as pg_name, upi_id, owner_name as account_name, qr_code as qr_image_url, payment_mode FROM pgs WHERE id = ?', [pg_id]);
    
    if (rows.length === 0) {
      return res.json({ pg_name: '', upi_id: '', account_name: '', qr_image_url: null, payment_mode: 'development' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { pg_name, upi_id, account_name, payment_mode } = req.body;
    const pg_id = req.user.pg_id;
    let qr_image_url = null;

    if (!pg_id) {
       return res.status(403).json({ message: 'Unauthorized. PG Context missing.' });
    }
    
    if (req.file) {
      
      const optimizedFilename = `qr-${pg_id}-${Date.now()}.webp`;
      const optimizedPath = path.join(req.file.destination, optimizedFilename);
      
      await sharp(req.file.path)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(optimizedPath);
        
      
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete original upload:', err);
      });

      qr_image_url = `/uploads/${optimizedFilename}`;
    }

    const [existing] = await pool.execute('SELECT qr_code FROM pgs WHERE id = ?', [pg_id]);
    
    if (existing.length === 0) {
       return res.status(404).json({ message: 'PG not found.' });
    }

    const finalImageUrl = qr_image_url || existing[0].qr_code;
    
    await pool.execute(
      'UPDATE pgs SET name = ?, upi_id = ?, owner_name = ?, qr_code = ?, payment_mode = ? WHERE id = ?',
      [pg_name || 'My PG', upi_id || '', account_name || '', finalImageUrl, payment_mode || 'development', pg_id]
    );

    res.json({ message: 'Settings updated successfully', qr_image_url: finalImageUrl });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
