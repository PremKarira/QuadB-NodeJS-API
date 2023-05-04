import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config()

const app = express();
app.set('view engine', 'ejs');
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const tickerSchema = new mongoose.Schema({
  name: String,
  last: Number,
  buy: Number,
  sell: Number,
  volume: Number,
  base_unit: String,
});

const Ticker = mongoose.model('Ticker', tickerSchema);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

app.get('/fetch-top-10', async (req, res) => {
  try {
    const response = await fetch('https://api.wazirx.com/api/v2/tickers');
    const data = await response.json();
    const top10 = Object.values(data)
      .sort((a, b) => b.base_unit - a.base_unit)
      .slice(0, 10)
      .map(({ name, last, buy, sell, volume, base_unit }) => ({
        name, last, buy, sell, volume, base_unit,
      }));

    await Ticker.deleteMany({});
    await Ticker.insertMany(top10);
    console.log("Database Updated");
    res.send('Top 10 tickers fetched and stored in database');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.get('/', async (req, res) => {
  try {
    const tickers = await Ticker.find().limit(10);

    res.render('index', { tickers });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => {
    const address = `http://localhost:${port}`;
    console.log(`Server started at ${address}`);
  });
  