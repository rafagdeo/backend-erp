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

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('Allowed Origins:', allowedOrigins);

app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    console.log('Origin recebida:', origin);

    if (!origin || allowedOrigins.includes(origin)) {
      console.log('Origin permitida:', origin);
      return callback(null, true);
    }

    console.log('Origin BLOQUEADA:', origin);
    return callback(new Error(`Origem não permitida: ${origin}`));
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