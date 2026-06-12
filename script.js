const VOTES_KEY = 'foodVotes';

function getVotes() {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse votes', e);
    return [];
  }
}

function saveVote(vote) {
  const arr = getVotes();
  arr.push(vote);
  localStorage.setItem(VOTES_KEY, JSON.stringify(arr));
}

function clearVotes() {
  localStorage.removeItem(VOTES_KEY);
}

function renderResults() {
  const votes = getVotes();
  const counts = {};
  votes.forEach(v => counts[v.choice] = (counts[v.choice] || 0) + 1);

  const countsRoot = document.getElementById('counts');
  const entriesRoot = document.getElementById('entries');
  countsRoot.innerHTML = '';
  entriesRoot.innerHTML = '';

  const options = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
  if (options.length === 0) {
    countsRoot.innerHTML = '<p>No votes yet.</p>';
  } else {
    options.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'count';
      div.textContent = `${opt}: ${counts[opt]}`;
      countsRoot.appendChild(div);
    });
  }

  if (votes.length > 0) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>#</th><th>Name</th><th>Choice</th><th>Time</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');

    votes.slice().reverse().forEach((v, i) => {
      const tr = document.createElement('tr');
      const idx = document.createElement('td'); idx.textContent = votes.length - i;
      const name = document.createElement('td'); name.textContent = v.name || '-';
      const choice = document.createElement('td'); choice.textContent = v.choice;
      const time = document.createElement('td'); time.textContent = new Date(v.time).toLocaleString();
      tr.appendChild(idx);
      tr.appendChild(name);
      tr.appendChild(choice);
      tr.appendChild(time);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    entriesRoot.appendChild(table);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // If on vote page
  const form = document.getElementById('voteForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const choiceEl = document.querySelector('input[name="choice"]:checked');
      if (!choiceEl) {
        alert('Please select a menu option.');
        return;
      }
      const name = document.getElementById('studentName').value.trim();
      const vote = { name: name || null, choice: choiceEl.value, time: new Date().toISOString() };
      saveVote(vote);
      alert('Thanks — your vote has been recorded.');
      form.reset();
      // redirect to results page to show aggregated data
      window.location.href = 'results.html';
    });

    const viewBtn = document.getElementById('viewResults');
    if (viewBtn) viewBtn.addEventListener('click', () => window.location.href = 'results.html');
  }

  // If on results page
  const resultsRoot = document.getElementById('resultsRoot');
  if (resultsRoot) {
    renderResults();
    document.getElementById('back').addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('clear').addEventListener('click', () => {
      if (confirm('Clear all votes from this browser?')) {
        clearVotes();
        renderResults();
      }
    });
  }
});