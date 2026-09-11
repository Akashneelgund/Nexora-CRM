import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cron from 'node-cron';
import apiRouter from './routes/api.js';
import { initializeDatabase } from './models/schema.js';
import { seedDatabase } from './seeds/seed.js';
import { generateDailySalesSummary, sendWhatsAppMessage } from './services/whatsappService.js';
import db from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize DB and auto-seed if needed
initializeDatabase();
const usersCount = db.get<any>('SELECT COUNT(id) as cnt FROM users')?.cnt || 0;
if (usersCount === 0) {
  console.log('Database empty, auto-seeding demo data...');
  seedDatabase();
}

app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Nexora CRM API Server', time: new Date().toISOString() });
});

// Serve frontend static build in production
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

io.on('connection', (socket) => {
  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
  });

  socket.on('send_message', (data: any) => {
    socket.to(data.roomId).emit('new_message', data);
  });

  socket.on('typing', (data: any) => {
    socket.to(data.roomId).emit('user_typing', data);
  });
});

cron.schedule('30 20 * * *', async () => {
  console.log('⏰ [Cron] Running Daily Sales Report WhatsApp Dispatch...');
  try {
    const summary = generateDailySalesSummary();
    const config = db.get<any>("SELECT recipients FROM integrations_whatsapp WHERE id = 'wa-01'");
    const recipients = config ? JSON.parse(config.recipients) : ['+91 9986917364', '9986917364'];

    for (const phone of recipients) {
      await sendWhatsAppMessage(phone, summary.formattedMessage);
    }
    console.log('✅ [Cron] Daily WhatsApp Sales Reports dispatched successfully.');
  } catch (err) {
    console.error('❌ [Cron] Failed to dispatch daily WhatsApp reports:', err);
  }
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`🚀 NEXORA CRM API Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time chat & notifications`);
});

export { app, server, io };
