import pool from '../config/db.js';


export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const pgId = req.user.pg_id || null;
    const [rows] = await pool.execute(`
      SELECT * FROM notifications 
      WHERE user_id = ? AND (pg_id = ? OR pg_id IS NULL)
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId, pgId]);
    
    const [unreadCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND (pg_id = ? OR pg_id IS NULL) AND is_read = FALSE
    `, [userId, pgId]);

    res.json({
      notifications: rows,
      unreadCount: unreadCount[0].count
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const pgId = req.user.pg_id || null;
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ? AND (pg_id = ? OR pg_id IS NULL)', [id, req.user.id, pgId]);
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const markAllAsRead = async (req, res) => {
  try {
    const pgId = req.user.pg_id || null;
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND (pg_id = ? OR pg_id IS NULL)', [req.user.id, pgId]);
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const pgId = req.user.pg_id || null;
    await pool.execute('DELETE FROM notifications WHERE id = ? AND user_id = ? AND (pg_id = ? OR pg_id IS NULL)', [id, req.user.id, pgId]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
