import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all chats for a user
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    const chats = db.prepare('SELECT * FROM Chats').all();
    const userChats = chats.filter(chat => {
      const participants = JSON.parse(chat.participants);
      return participants.includes(userId);
    });
    
    const enrichedChats = userChats.map(chat => {
      const lastMessage = db.prepare('SELECT * FROM Messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1').get(chat.id);
      
      const participants = JSON.parse(chat.participants);
      const otherUserId = participants.find(p => p !== userId) || userId;
      const otherUser = db.prepare('SELECT id, name, avatar, is_online, last_seen FROM Users WHERE id = ?').get(otherUserId);
      
      return {
        ...chat,
        lastMessage,
        otherUser
      };
    });
    
    enrichedChats.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.created_at).getTime();
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.created_at).getTime();
        return timeB - timeA;
    });
    
    res.json(enrichedChats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = db.prepare('SELECT * FROM Messages WHERE chat_id = ? ORDER BY created_at ASC').all(chatId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
