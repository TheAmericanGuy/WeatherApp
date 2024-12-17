import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../client')));


app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});


app.use(routes);
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
