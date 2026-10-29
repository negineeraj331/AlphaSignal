import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import researchRouter from './routes/research.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

function isKeyConfigured(key) {
  return !!key && key.trim().length > 0 && !key.includes('your_') && !key.includes('_here');
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(
      Boolean,
    ),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(express.json({ limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api', researchRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAI: isKeyConfigured(process.env.OPENAI_API_KEY),
      hasTavily: isKeyConfigured(process.env.TAVILY_API_KEY),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Investment Research Agent Backend`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   OpenAI: ${isKeyConfigured(process.env.OPENAI_API_KEY) ? '✅ configured' : '❌ missing'}`);
  console.log(`   Tavily: ${isKeyConfigured(process.env.TAVILY_API_KEY) ? '✅ configured' : '❌ missing'}\n`);
});

export default app;
