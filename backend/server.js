import http from 'http';
import os from 'node:os';
import { Server } from 'socket.io';
import env from './config/env.js';
import openai from './lib/openai.js';
import prisma from './lib/prisma.js';
import { ensureGlobalChat } from './bootstrap/ensureGlobalChat.js';
import { createApp } from './app.js';
import { SignLanguageService } from './services/sign-language/SignLanguageService.js';
import { SpeechToTextService } from './services/speech-to-text/SpeechToTextService.js';
import { TextToSignService } from './services/text-to-sign/TextToSignService.js';
import { registerChatHandlers } from './sockets/registerChatHandlers.js';
import { registerSignLanguageHandlers } from './sockets/registerSignLanguageHandlers.js';

const signLanguageService = new SignLanguageService(env.signLanguage);
const speechToTextService = new SpeechToTextService({
  client: openai,
  config: env.speechToText
});
const textToSignService = new TextToSignService();
const app = createApp({
  prisma,
  jwtSecret: env.jwtSecret,
  signLanguageService,
  speechToTextService,
  speechToTextConfig: env.speechToText,
  textToSignService
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  perMessageDeflate: false,
  maxHttpBufferSize: 100 * 1024
});

// /chat namespace — private & group messaging
registerChatHandlers(io, prisma, env.jwtSecret);

// /sign-language namespace — AI gesture recognition
registerSignLanguageHandlers(io, signLanguageService);

await ensureGlobalChat(prisma);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `[Signova] Port ${env.port} is already in use. Stop the other Node process or set PORT in backend/.env.`
    );
    process.exit(1);
  }
  throw error;
});

function listLanIPv4Addresses() {
  const results = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (isIPv4 && !net.internal) results.push(net.address);
    }
  }
  return [...new Set(results)];
}

server.listen(env.port, '0.0.0.0', () => {
  console.log(`Backend server listening on 0.0.0.0:${env.port} (LAN + localhost)`);
  console.log(`On this PC: http://localhost:${env.port}`);
  const lan = listLanIPv4Addresses();
  if (lan.length > 0) {
    console.log(`On your phone (same Wi-Fi): ${lan.map((ip) => `http://${ip}:${env.port}`).join('  |  ')}`);
  }
});
