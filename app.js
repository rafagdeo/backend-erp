const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const port = process.env.PORT || 3001;

const siteRouter = require('./app/src/routes/routes');

const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
];

app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origem não permitida'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100kb' }));

app.use(siteRouter);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});