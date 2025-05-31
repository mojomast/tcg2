const express = require('express');
const { execSync } = require('child_process');

const app = express();
const port = 3002;

// Test the cards search API directly
app.get('/test-cards', (req, res) => {
  try {
    const search = req.query.search || '';
    const manaType = req.query.manaType || '';
    const cardType = req.query.cardType || '';
    
    let query = 'SELECT * FROM cards WHERE 1=1';
    
    if (search) {
      query += ` AND (name LIKE '%${search}%' OR rules_text LIKE '%${search}%')`;
    }
    
    if (cardType) {
      query += ` AND card_type = '${cardType}'`;
    }
    
    query += ' ORDER BY name ASC LIMIT 20';
    
    console.log('Test Query:', query);
    
    const result = execSync(`sqlite3 data/tcg.db "${query}"`, { encoding: 'utf8' });
    const lines = result.trim().split('\n').filter(line => line.length > 0);
    
    const cards = lines.map(line => {
      const parts = line.split('|');
      return {
        id: parts[0],
        name: parts[1],
        mana_cost: parts[2],
        cmc: parts[3],
        type_line: parts[4],
        card_type: parts[5],
        rarity: parts[7],
        rules_text: parts[8]
      };
    });
    
    res.json({
      query: query,
      count: cards.length,
      cards: cards
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to test cards query', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Card search test server running at http://localhost:${port}`);
  console.log('Test endpoints:');
  console.log(`  http://localhost:${port}/test-cards`);
  console.log(`  http://localhost:${port}/test-cards?search=bear`);
  console.log(`  http://localhost:${port}/test-cards?cardType=Creature`);
});

