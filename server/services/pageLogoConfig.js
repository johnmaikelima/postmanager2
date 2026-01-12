import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data/page-logos.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ byPageId: {} }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { byPageId: {} };
    if (!parsed.byPageId || typeof parsed.byPageId !== 'object') return { byPageId: {} };
    return parsed;
  } catch {
    return { byPageId: {} };
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

class PageLogoConfigService {
  getAll() {
    return readData().byPageId;
  }

  getForPage(pageId) {
    const map = readData().byPageId;
    return map[pageId] || null;
  }

  setForPage(pageId, logoFilenameOrNull) {
    const data = readData();
    if (!data.byPageId) data.byPageId = {};

    if (!logoFilenameOrNull) {
      delete data.byPageId[pageId];
    } else {
      data.byPageId[pageId] = logoFilenameOrNull;
    }

    writeData(data);
    return { pageId, logo: data.byPageId[pageId] || null };
  }
}

export default new PageLogoConfigService();
