const SERVER_BASE = window.location.origin; // assumes server serves pages
const API_VOTE = '/api/vote';
const API_COUNTS = '/api/counts';
const API_VOTES = '/api/votes';
const VOTES_KEY = 'foodVotes_fallback';

async function postVoteToServer(vote) {
  const res = await fetch(API_VOTE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vote) });
  if (!res.ok) throw new Error('Server rejected vote');
  return res.json();
}

async function fetchCountsFromServer() {
  const res = await fetch(API_COUNTS);
  if (!res.ok) throw new Error('Failed to get counts');
  return res.json();
}

function getFallbackVotes(){
  try{ const raw = localStorage.getItem(VOTES_KEY); return raw?JSON.parse(raw):[] }catch(e){return[]} }
function saveFallbackVote(v){ const arr=getFallbackVotes(); arr.push(v); localStorage.setItem(VOTES_KEY, JSON.stringify(arr)) }
function clearFallback(){ localStorage.removeItem(VOTES_KEY) }

function enableOptionSelection() {
  const cards = document.querySelectorAll('.card');
  let selected = null;
  function select(card){
    cards.forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    selected = card.dataset.value;
  }
  cards.forEach(card=>{
    card.addEventListener('click', ()=> select(card));
    card.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); select(card) } });
  });
  return ()=>selected;
}

function renderTable(votes, container){
  container.innerHTML='';
  if(!votes || votes.length===0){ container.innerHTML='<p>No votes yet.</p>'; return }
  const table=document.createElement('table');
  table.innerHTML = '<thead><tr><th>#</th><th>Name</th><th>Choice</th><th>Time</th></tr></thead>';
  const tbody=document.createElement('tbody');
  votes.slice().reverse().forEach((v,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${votes.length-i}</td><td>${v.name||'-'}</td><td>${v.choice}</td><td>${new Date(v.time).toLocaleString()}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

async function renderResultsChart() {
  const countsRoot = document.getElementById('counts');
  const entriesRoot = document.getElementById('entries');
  countsRoot.innerHTML=''; entriesRoot.innerHTML='';
  let countsData=null; let votesList=null;
  try{
    countsData = await fetchCountsFromServer();
    // server returns {counts: {Pizza: 3,...}, votes: [...] }
    votesList = (await fetch('/api/votes')).json();
  }catch(e){
    // fallback to local
    const fb = getFallbackVotes();
    votesList = fb;
    countsData = { counts: {} };
    fb.forEach(v=> countsData.counts[v.choice] = (countsData.counts[v.choice]||0)+1);
  }

  const labels = Object.keys(countsData.counts);
  const data = labels.map(l => countsData.counts[l]);

  const ctx = document.getElementById('votesChart');
  if(window._votesChart) { window._votesChart.data.labels = labels; window._votesChart.data.datasets[0].data = data; window._votesChart.update(); }
  else { window._votesChart = new Chart(ctx, { type:'pie', data:{ labels, datasets:[{ data, backgroundColor:[ '#2b7cff','#ff7a59','#ffd166','#6be3a1','#b57bff' ] }] }, options:{responsive:true} }) }

  // show simple counts
  if(labels.length===0) countsRoot.innerHTML = '<p>No votes yet.</p>';
  else labels.forEach(l=>{ const d=document.createElement('div'); d.className='count'; d.textContent = `${l}: ${countsData.counts[l]}`; countsRoot.appendChild(d) });

  // entries table
  renderTable(votesList, entriesRoot);
}

document.addEventListener('DOMContentLoaded', ()=>{
  const getSelected = enableOptionSelection();
  const form = document.getElementById('voteForm');
  if(form){
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const choice = getSelected();
      if(!choice){ alert('Please select an option.'); return }
      const name = document.getElementById('studentName').value.trim();
      const vote = { name: name||null, choice, time: new Date().toISOString() };
      try{
        await postVoteToServer(vote);
      }catch(err){
        // fallback
        saveFallbackVote(vote);
      }
      alert('Thanks — your vote is recorded.');
      window.location.href = 'results.html';
    });
    const viewBtn = document.getElementById('viewResults'); if(viewBtn) viewBtn.addEventListener('click', ()=> window.location.href='results.html');
  }

  const resultsRoot = document.getElementById('resultsRoot');
  if(resultsRoot){
    renderResultsChart();
    document.getElementById('back').addEventListener('click', ()=> window.location.href='index.html');
    document.getElementById('refresh').addEventListener('click', ()=> renderResultsChart());
    document.getElementById('clear').addEventListener('click', async ()=>{
      if(!confirm('Clear all votes on the server? This removes server-stored votes.')) return;
      try{ await fetch('/api/votes',{method:'DELETE'}); clearFallback(); renderResultsChart(); }catch(e){ alert('Failed to clear on server; fallback cleared.'); clearFallback(); renderResultsChart(); }
    });
  }
});