import { Request, Response } from 'express';
import db from '../config/db.js';

export async function listChatRooms(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  
  let query = `
    SELECT r.*,
           (SELECT message FROM chat_messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM chat_messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
           (SELECT COUNT(id) FROM chat_messages WHERE room_id = r.id) as message_count
    FROM chat_rooms r
    LEFT JOIN chat_members m ON r.id = m.room_id AND m.user_id = ?
    WHERE r.room_type IN ('announcement', 'group')
       OR (r.room_type = 'team' AND (r.team_id = ? OR ? = 'SUPER_ADMIN'))
       OR m.user_id = ?
    GROUP BY r.id
    ORDER BY last_message_time DESC
  `;

  const rooms = db.all<any>(query, [user.id, user.team_id || '', user.role_code, user.id]);
  res.json({ success: true, rooms });
}

export async function getRoomMessages(req: Request, res: Response): Promise<void> {
  const { roomId } = req.params;
  const messages = db.all<any>(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.role_id, r.code as sender_role
    FROM chat_messages m
    JOIN users u ON m.sender_id = u.id
    JOIN roles r ON u.role_id = r.id
    WHERE m.room_id = ?
    ORDER BY m.created_at ASC
    LIMIT 150
  `, [roomId]);

  res.json({ success: true, messages });
}

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { roomId, message, attachments } = req.body;

  if (!roomId || !message) {
    res.status(400).json({ success: false, message: 'Room ID and message text required' });
    return;
  }

  const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO chat_messages (id, room_id, sender_id, message, attachments, is_pinned)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [msgId, roomId, user.id, message, attachments ? JSON.stringify(attachments) : null]
  );

  const fullMsg = db.get<any>(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, r.code as sender_role
    FROM chat_messages m
    JOIN users u ON m.sender_id = u.id
    JOIN roles r ON u.role_id = r.id
    WHERE m.id = ?
  `, [msgId]);

  res.json({ success: true, message: fullMsg });
}

export async function listAnnouncements(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const announcements = db.all<any>(`
    SELECT a.*, u.name as author_name, u.avatar as author_avatar
    FROM announcements a
    JOIN users u ON a.created_by = u.id
    WHERE a.target_team_id IS NULL OR a.target_team_id = ?
    ORDER BY a.created_at DESC
  `, [user.team_id || '']);

  res.json({ success: true, announcements });
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { title, content, priority = 'Normal', target_team_id } = req.body;

  if (!title || !content) {
    res.status(400).json({ success: false, message: 'Title and content required' });
    return;
  }

  const annId = `ann-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO announcements (id, title, content, priority, created_by, target_team_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [annId, title, content, priority, user.id, target_team_id || null]
  );

  const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO chat_messages (id, room_id, sender_id, message, is_pinned)
     VALUES (?, 'room-announcements', ?, ?, 1)`,
    [msgId, user.id, `📢 [ANNOUNCEMENT - ${title}]\n${content}`]
  );

  res.json({ success: true, message: 'Announcement broadcasted successfully!', announcementId: annId });
}
