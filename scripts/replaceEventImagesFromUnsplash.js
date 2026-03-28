const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');

const Event = require('../src/models/Event');

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/event_ticket_management';
const UNSPLASH_ACCESS_KEY = process.env.YOUR_UNSPLASH_KEY || process.env.UNSPLASH_ACCESS_KEY || '';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

async function fetchUnsplashImagePool(total) {
  if (!UNSPLASH_ACCESS_KEY || total <= 0) return [];

  const images = [];
  let remaining = total;

  while (remaining > 0) {
    const batchSize = Math.min(remaining, 30);
    const query = pick(['music event', 'concert stage', 'festival crowd', 'conference hall', 'live performance']);

    const response = await axios.get('https://api.unsplash.com/photos/random', {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      params: {
        count: batchSize,
        query,
        orientation: 'landscape',
        content_filter: 'high',
      },
      timeout: 15000,
    });

    const payload = Array.isArray(response.data) ? response.data : [response.data];
    const batchImages = payload
      .map((item) => item?.urls?.regular || item?.urls?.full || item?.urls?.raw)
      .filter(Boolean);

    images.push(...batchImages);
    remaining = total - images.length;
    if (batchImages.length === 0) break;
  }

  return images;
}

async function run() {
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('Thieu YOUR_UNSPLASH_KEY (hoac UNSPLASH_ACCESS_KEY).');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    const events = await Event.find({}).sort({ createdAt: 1 });
    if (!events.length) {
      console.log('Khong co event nao de cap nhat anh.');
      return;
    }

    const imagePool = await fetchUnsplashImagePool(events.length + 10);
    if (!imagePool.length) {
      console.log('Khong lay duoc anh tu Unsplash.');
      return;
    }

    const ops = events.map((event, index) => {
      const fallback = `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80&sig=${index + 1}`;
      return {
        updateOne: {
          filter: { _id: event._id },
          update: { $set: { image: imagePool[index] || fallback } },
        },
      };
    });

    const result = await Event.bulkWrite(ops);
    console.log(`Da cap nhat anh Unsplash cho ${result.modifiedCount || 0}/${events.length} event.`);
  } catch (error) {
    console.error('Cap nhat anh that bai:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

run();
