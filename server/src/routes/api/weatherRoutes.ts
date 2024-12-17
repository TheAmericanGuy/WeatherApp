import { Router } from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const HISTORY_FILE = './db/searchHistory.json';
const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

router.post('/', async (req, res) => {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ message: 'City name is required.' });
  }

  try {
    // 1. Buscar as coordenadas da cidade
    const geoResponse = await axios.get(
      `${API_BASE_URL}/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );

    if (!geoResponse.data.length) {
      return res.status(404).json({ message: 'City not found.' });
    }

    const { lat, lon, name } = geoResponse.data[0];

    // 2. Buscar os dados climáticos usando as coordenadas
    const weatherResponse = await axios.get(
      `${API_BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    // 3. Ler o histórico atual ou criar um novo
    const historyData = await fs.readFile(HISTORY_FILE, 'utf-8').catch(() => '[]');
    const history = JSON.parse(historyData);

    // 4. Adicionar nova cidade ao histórico com ID único
    const newEntry = { id: uuidv4(), city: name, lat, lon };
    history.push(newEntry);

    // 5. Salvar o histórico atualizado no arquivo
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));

    // 6. Retornar os dados climáticos e o histórico salvo
    return res.json({ weather: weatherResponse.data, history: newEntry });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching weather data.' });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8').catch(() => '[]');
    const history = JSON.parse(data);
    return res.json(history);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error reading history file.' });
  }
});

router.delete('/history/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Ler o histórico atual
    const data = await fs.readFile(HISTORY_FILE, 'utf-8').catch(() => '[]');
    let history = JSON.parse(data);

    // 2. Remover a entrada com o ID fornecido
    const initialLength = history.length;
    history = history.filter((entry: any) => entry.id !== id);

    if (history.length === initialLength) {
      return res.status(404).json({ message: 'City not found in history.' });
    }

    // 3. Salvar o histórico atualizado no arquivo
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));

    return res.json({ message: 'City deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error deleting city from history.' });
  }
});

export default router;
