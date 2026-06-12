const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname,'votes.json');

async function readVotes(){
  try{ const raw = await fs.readFile(DATA_FILE,'utf8'); return JSON.parse(raw); }catch(e){ return [] }
}
async function writeVotes(votes){ await fs.writeFile(DATA_FILE, JSON.stringify(votes,null,2),'utf8'); }

// Serve static site
app.use(express.static(__dirname));

app.post('/api/vote', async (req,res)=>{
  const { name, choice, time } = req.body || {};
  if(!choice) return res.status(400).json({ error: 'Missing choice' });
  const vote = { name: name||null, choice, time: time||new Date().toISOString() };
  const votes = await readVotes();
  votes.push(vote);
  await writeVotes(votes);
  res.json({ ok:true, vote });
});

app.get('/api/votes', async (req,res)=>{
  const votes = await readVotes();
  res.json(votes);
});

app.get('/api/counts', async (req,res)=>{
  const votes = await readVotes();
  const counts = {};
  votes.forEach(v => counts[v.choice] = (counts[v.choice]||0)+1);
  res.json({ counts, votes });
});

app.delete('/api/votes', async (req,res)=>{
  await writeVotes([]);
  res.json({ ok:true });
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Server running on http://localhost:${port}`));
