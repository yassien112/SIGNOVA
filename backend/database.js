import sqlite from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const db = sqlite(path.join(dataDir, 'database.sqlite'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    is_online BOOLEAN DEFAULT false,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Chats (
    id TEXT PRIMARY KEY,
    participants TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent',
    FOREIGN KEY (chat_id) REFERENCES Chats(id),
    FOREIGN KEY (sender_id) REFERENCES Users(id)
  );
`);

// Seed some initial data if empty
const usersCount = db.prepare('SELECT COUNT(*) as count FROM Users').get();
if (usersCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO Users (id, name, avatar, is_online) VALUES (?, ?, ?, ?)');
  insertUser.run('user-1', 'Alex Johnson', 'https://i.pravatar.cc/150?u=a042581f4e29026704d', 1);
  insertUser.run('user-2', 'Sarah Smith', 'https://i.pravatar.cc/150?u=a042581f4e29026704e', 0);
  insertUser.run('user-3', 'Emily Davis', 'https://i.pravatar.cc/150?u=a042581f4e29026704f', 1);
  insertUser.run('current-user', 'Jane Doe', 'https://i.pravatar.cc/150?u=a042581f4e29026704g', 1);

  const insertChat = db.prepare('INSERT INTO Chats (id, participants) VALUES (?, ?)');
  insertChat.run('chat-1', JSON.stringify(['current-user', 'user-1']));
  insertChat.run('chat-2', JSON.stringify(['current-user', 'user-2']));

  const insertMsg = db.prepare('INSERT INTO Messages (id, chat_id, sender_id, message_text, status) VALUES (?, ?, ?, ?, ?)');
  insertMsg.run('msg-1', 'chat-1', 'user-1', 'Hi Jane, how are you?', 'delivered');
  insertMsg.run('msg-2', 'chat-1', 'current-user', 'Im doing well Alex, thanks!', 'delivered');
  insertMsg.run('msg-3', 'chat-2', 'user-2', 'Are we still meeting up later?', 'delivered');
}

export default db;
