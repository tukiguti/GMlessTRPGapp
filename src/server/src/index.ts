/**
 * GMレスLoL風TRPG - バックエンドサーバー
 * GCP e2-micro最適化版
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { setupWebSocket } from './websocket/connection.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// GCP最適化: 同時接続数制限
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS || '70', 10);
let connectedClients = 0;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e6, // 1MB (GCP最適化: ネットワーク転送量削減)
  pingTimeout: 60000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  }
});

// GCP最適化: 接続数制限ミドルウェア
io.use((socket, next) => {
  if (connectedClients >= MAX_CONNECTIONS) {
    console.warn('[WebSocket] Server full, rejecting connection');
    return next(new Error('Server full'));
  }
  connectedClients++;
  console.log(`[WebSocket] Connection accepted (${connectedClients}/${MAX_CONNECTIONS})`);
  next();
});

// GCP最適化: gzip圧縮（ネットワーク転送量削減）
app.use(compression());

// GCP最適化: レート制限（ネットワーク使用量管理）
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 60, // 最大60リクエスト/分
  message: 'Too many requests from this IP'
});

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '100kb' })); // GCP最適化: ペイロードサイズ制限
app.use('/api/', apiLimiter);

// ヘルスチェック
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    connections: connectedClients,
    maxConnections: MAX_CONNECTIONS,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
    }
  });
});

// APIルート
app.get('/api/status', (req, res) => {
  res.json({
    online: true,
    version: '1.0.0',
    connections: connectedClients
  });
});

// メモリ使用量監視（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log('[Memory] Heap:', Math.round(memUsage.heapUsed / 1024 / 1024), 'MB');
  }, 30000); // 30秒ごと
}

// WebSocket接続のセットアップ
setupWebSocket(io, () => {
  connectedClients--;
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Max connections: ${MAX_CONNECTIONS}`);
  console.log(`[Server] Memory limit: 384MB`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
