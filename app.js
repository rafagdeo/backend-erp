const express = require('express');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const port = process.env.PORT || 3001;
const siteRouter = require('./app/src/routes/routes');

app.use(express.json());
app.use(siteRouter);

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});