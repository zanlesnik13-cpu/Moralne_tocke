import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'moral_points.json');

// Ensure data directory and file exist
function getDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      users: {},
      rules: [
        { id: "rule-1", label: "predavanja", points: -5, isDirectChallenge: false },
        { id: "rule-2", label: "vaje", points: -10, isDirectChallenge: false },
        { id: "rule-3", label: "žreb", points: -20, isDirectChallenge: false },
        { id: "rule-4", label: "častiš 20eur", points: 5, isDirectChallenge: false },
        { id: "rule-5", label: "teden vse", points: 10, isDirectChallenge: false },
        { id: "rule-6", label: "zamutiš", points: 10, isDirectChallenge: false },
        { id: "rule-7", label: "seks", points: 50, isDirectChallenge: false },
        { id: "rule-8", label: "ne gre kdo vn", points: -10, isDirectChallenge: false },
        { id: "rule-9", label: "podpišeš", points: 5, isDirectChallenge: false },
        { id: "rule-10", label: "tožarjenje direkt challenge", points: 0, isDirectChallenge: true },
        { id: "rule-11", label: "ne igraš ludo kinga", points: -5, isDirectChallenge: false }
      ],
      history: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading JSON db:", err);
    return { users: {}, rules: [], history: [] };
  }
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving JSON db:", err);
  }
}

// Compute scores for all users
function computeScores(db: any) {
  const scores: Record<string, { total: number; count: number; directChallenges: number }> = {};
  
  // Initialize for all known users
  for (const username of Object.keys(db.users || {})) {
    scores[username] = { total: 0, count: 0, directChallenges: 0 };
  }
  
  // Sum up history
  for (const item of (db.history || [])) {
    const target = item.targetUser;
    if (!scores[target]) {
      scores[target] = { total: 0, count: 0, directChallenges: 0 };
    }
    scores[target].total += Number(item.points) || 0;
    scores[target].count += 1;
    if (item.isDirectChallenge) {
      scores[target].directChallenges += 1;
    }
  }

  return scores;
}

// API Routes
app.get('/api/state', (req, res) => {
  const db = getDb();
  const scores = computeScores(db);
  const usersList = Object.keys(db.users || {}).map(name => ({
    name,
    createdAt: db.users[name].createdAt,
    avatarColor: db.users[name].avatarColor || 'indigo'
  }));

  // Ensure any user mentioned in history is also in users list
  const knownNames = new Set(usersList.map(u => u.name));
  for (const item of (db.history || [])) {
    if (item.targetUser && !knownNames.has(item.targetUser)) {
      usersList.push({
        name: item.targetUser,
        createdAt: item.timestamp,
        avatarColor: 'slate'
      });
      knownNames.add(item.targetUser);
    }
  }

  res.json({
    users: usersList,
    rules: db.rules || [],
    history: (db.history || []).slice().reverse(),
    scores
  });
});

// Authentication: Login or register with 4-digit PIN
app.post('/api/auth/login', (req, res) => {
  const { name, pin } = req.body;
  const cleanName = (name || '').trim();
  const cleanPin = (pin || '').trim();

  if (!cleanName) {
    return res.status(400).json({ error: 'Prosimo, vnesite svoje ime.' });
  }

  if (!/^\d{4}$/.test(cleanPin)) {
    return res.status(400).json({ error: 'PIN mora vsebovati natanko 4 številke.' });
  }

  const db = getDb();
  if (!db.users) db.users = {};

  if (db.users[cleanName]) {
    // Check PIN
    if (db.users[cleanName].pin !== cleanPin) {
      return res.status(401).json({ error: 'Napačna 4-mestna koda (PIN) za to ime.' });
    }
    return res.json({ success: true, user: cleanName, isNew: false });
  } else {
    // Create new profile
    const colors = ['emerald', 'blue', 'amber', 'rose', 'indigo', 'purple', 'teal', 'cyan'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    db.users[cleanName] = {
      pin: cleanPin,
      createdAt: new Date().toISOString(),
      avatarColor: randomColor
    };
    saveDb(db);
    return res.json({ success: true, user: cleanName, isNew: true });
  }
});

// Add points entry (Audit log)
app.post('/api/points/add', (req, res) => {
  const { recordedBy, pin, targetUser, points, reason, isDirectChallenge } = req.body;
  const cleanRecorder = (recordedBy || '').trim();
  const cleanTarget = (targetUser || '').trim();
  const cleanReason = (reason || '').trim();
  const pts = parseInt(points, 10);

  if (!cleanRecorder) {
    return res.status(400).json({ error: 'Prijavljen uporabnik ni določen.' });
  }

  const db = getDb();
  if (!db.users || !db.users[cleanRecorder] || db.users[cleanRecorder].pin !== pin) {
    return res.status(403).json({ error: 'Varnostno preverjanje PIN ni uspelo. Prosimo, ponovno se prijavite.' });
  }

  if (!cleanTarget) {
    return res.status(400).json({ error: 'Izberite osebo, ki ji dodeljujete točke.' });
  }

  if (isNaN(pts)) {
    return res.status(400).json({ error: 'Vnesite veljavno število točk.' });
  }

  if (!cleanReason) {
    return res.status(400).json({ error: 'Vnesite razlog za dodelitev točk.' });
  }

  // If targetUser doesn't exist in users dictionary yet, auto-create a stub profile
  if (!db.users[cleanTarget]) {
    const colors = ['emerald', 'blue', 'amber', 'rose', 'indigo', 'purple', 'teal'];
    db.users[cleanTarget] = {
      pin: '0000', // Default initial PIN until claimed
      createdAt: new Date().toISOString(),
      avatarColor: colors[Math.floor(Math.random() * colors.length)]
    };
  }

  const newEntry = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    recordedBy: cleanRecorder,
    targetUser: cleanTarget,
    points: pts,
    reason: cleanReason,
    isDirectChallenge: Boolean(isDirectChallenge)
  };

  if (!db.history) db.history = [];
  db.history.push(newEntry);
  saveDb(db);

  const scores = computeScores(db);
  res.json({
    success: true,
    entry: newEntry,
    scores,
    history: db.history.slice().reverse()
  });
});

// Update rules
app.post('/api/rules/save', (req, res) => {
  const { updatedBy, pin, rules } = req.body;
  const cleanRecorder = (updatedBy || '').trim();

  const db = getDb();
  if (!db.users || !db.users[cleanRecorder] || db.users[cleanRecorder].pin !== pin) {
    return res.status(403).json({ error: 'Za urejanje pravil je potrebna overitev s PIN-om.' });
  }

  if (!Array.isArray(rules) || rules.length === 0) {
    return res.status(400).json({ error: 'Pravila ne smejo biti prazna.' });
  }

  db.rules = rules.map((r: any, idx: number) => ({
    id: r.id || `rule-${idx + 1}`,
    label: (r.label || '').trim(),
    points: parseInt(r.points, 10) || 0,
    isDirectChallenge: Boolean(r.isDirectChallenge)
  })).filter((r: any) => r.label.length > 0);

  // Add audit log note about rules update
  if (!db.history) db.history = [];
  db.history.push({
    id: `tx-${Date.now()}-rule`,
    timestamp: new Date().toISOString(),
    recordedBy: cleanRecorder,
    targetUser: 'VSI (Pravila)',
    points: 0,
    reason: `Posodobitev pravilnika (${db.rules.length} veljavnih kriterijev)`
  });

  saveDb(db);
  res.json({ success: true, rules: db.rules });
});

// Delete history transaction (Undo)
app.post('/api/history/delete', (req, res) => {
  const { id, requestedBy, pin } = req.body;
  const db = getDb();
  
  if (!db.users || !db.users[requestedBy] || db.users[requestedBy].pin !== pin) {
    return res.status(403).json({ error: 'Nimate pooblastila za brisanje vnosa.' });
  }

  const index = (db.history || []).findIndex((h: any) => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Vnos v zgodovini ne obstaja.' });
  }

  const removed = db.history.splice(index, 1)[0];
  saveDb(db);

  res.json({ success: true, removed, scores: computeScores(db) });
});

// Reset points / Mark challenge completed
app.post('/api/challenge/complete', (req, res) => {
  const { targetUser, recordedBy, pin, challengeDescription, penaltyPointsToOffset } = req.body;
  const db = getDb();

  if (!db.users || !db.users[recordedBy] || db.users[recordedBy].pin !== pin) {
    return res.status(403).json({ error: 'Neveljaven PIN uporabnika.' });
  }

  const offset = parseInt(penaltyPointsToOffset, 10) || 100;

  if (!db.history) db.history = [];
  db.history.push({
    id: `tx-${Date.now()}-challenge`,
    timestamp: new Date().toISOString(),
    recordedBy,
    targetUser,
    points: offset, // Reimburses +100 to lift them out of the penalty zone
    reason: `🎉 OPRAVLJEN IZZIV: ${challengeDescription || 'Oseba je uspešno opravila moralni izziv!'}`
  });

  saveDb(db);
  res.json({ success: true, scores: computeScores(db) });
});

// Vite middleware setup
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
