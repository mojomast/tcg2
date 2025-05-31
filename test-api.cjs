const express = require('express');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const port = 3001;

// Test the decks API directly
app.get('/api/decks', (req, res) => {
  try {
    // Use sqlite3 command line to get decks
    const result = execSync('sqlite3 data/tcg.db "SELECT * FROM decks;"', { encoding: 'utf8' });
    const lines = result.trim().split('\n');
    const decks = lines.map(line => {
      const parts = line.split('|');
      return {
        id: parts[0],
        player_id: parts[1],
        name: parts[2],
        format: parts[3],
        description: parts[4],
        created_at: parts[5],
        updated_at: parts[6]
      };
    });
    res.json(decks);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});

