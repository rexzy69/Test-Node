const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 5000;
const BLOCKED_JSON_PATH = path.join(__dirname, 'public', 'blocked.json');

app.use(express.json());
app.use(express.static('static'));
app.use(express.static('public'));

async function readBlockedUrls() {
  try {
    const data = await fs.readFile(BLOCKED_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(BLOCKED_JSON_PATH, '[]');
      return [];
    }
    throw error;
  }
}

async function writeBlockedUrls(urls) {
  const formattedUrls = urls.map(url => url.startsWith('http') ? url : `https://${url}`);
  await fs.writeFile(BLOCKED_JSON_PATH, JSON.stringify(formattedUrls, null, 2));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/get_blocked_urls', async (req, res) => {
  try {
    const blockedUrls = await readBlockedUrls();
    res.json(blockedUrls);
  } catch (error) {
    res.status(500).json({ error: 'Error reading blocked URLs' });
  }
});

app.post('/add_url', async (req, res) => {
  let { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  // Ensure the URL has the "https://" prefix
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const blockedUrls = await readBlockedUrls();
    if (!blockedUrls.includes(url)) {
      blockedUrls.push(url);
      await writeBlockedUrls(blockedUrls);
      res.status(201).json({ message: 'URL added successfully' });
    } else {
      res.status(409).json({ error: 'URL already exists' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error adding URL' });
  }
});

app.post('/remove_url', async (req, res) => {
  let { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  // Ensure the URL has the "https://" prefix for consistency
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const blockedUrls = await readBlockedUrls();
    const index = blockedUrls.indexOf(url);
    if (index !== -1) {
      blockedUrls.splice(index, 1);
      await writeBlockedUrls(blockedUrls);
      res.json({ message: 'URL removed successfully' });
    } else {
      res.status(404).json({ error: 'URL not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error removing URL' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
