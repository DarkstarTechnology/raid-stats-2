require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg'); // Use Pool instead of Client for better connection management
const retry = require('async-retry');

const app = express();
const port = 3000;
const corsOptions = {
  origin: 'http://localhost:4200',
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Use a pool for efficient management of connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL.toString(),
});

const retryOptions = {
  retries: 5,
  factor: 2,
  minTimeout: 1000,
  onRetry: (err, attempt) => console.log(`Attempt ${attempt}: Retrying database operation...`),
};

// General purpose query function with retry logic
const queryWithRetry = async (sql, params) => {
  return await retry(async bail => {
    const client = await pool.connect();
    try {
      const res = await client.query(sql, params);
      return res;
    } catch (error) {
      if (error.severity === 'FATAL') { // Example of a condition to bail out on specific errors
        bail(new Error('Fatal database error, cannot retry.'));
      }
      throw error; // Trigger a retry
    } finally {
      client.release();
    }
  }, retryOptions);
};

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

// Refactor API endpoints to use queryWithRetry
app.post('/api/player', async (req, res) => {
  const { name, race } = req.body;
  try {
    const result = await queryWithRetry('INSERT INTO public.player(name, race) VALUES($1, $2) RETURNING *', [name, race]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example refactor for a GET endpoint
app.get('/api/player', async (req, res) => {
  try {
    const result = await queryWithRetry('SELECT * FROM public.player', []);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refactored GET endpoint to use queryWithRetry for fetching a player by name
app.get('/api/player/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const result = await queryWithRetry('SELECT * FROM public.player WHERE name = $1', [name]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Player not found');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refactored PUT endpoint to use queryWithRetry for updating a player's race
app.put('/api/player/:name', async (req, res) => {
  const { name } = req.params;
  const { race } = req.body;
  try {
    const result = await queryWithRetry('UPDATE public.player SET race = $1 WHERE name = $2 RETURNING *', [race, name]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Player not found');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refactored DELETE endpoint to use queryWithRetry for deleting a player by name
app.delete('/api/player/:name', async (req, res) => {
  const { name } = req.params;
  try {
    await queryWithRetry('DELETE FROM public.player WHERE name = $1', [name]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refactored GET endpoint to use queryWithRetry for fetching playerInRaid by name and redditId
app.get('/api/playerInRaid/:name/:redditId', async (req, res) => {
  const { name, redditId } = req.params;
  try {
    const result = await queryWithRetry('SELECT * FROM player_in_raid WHERE name = $1 AND redditId = $2', [name, redditId]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refactored GET endpoint to use queryWithRetry for fetching playerInRaid by name
app.get('/api/playerInRaid/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const result = await queryWithRetry('SELECT * FROM player_in_raid WHERE name = $1', [name]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refactored GET endpoint to use queryWithRetry for fetching all raids
app.get('/api/raid', async (req, res) => {
  try {
    const result = await queryWithRetry('SELECT * FROM public.raid', []);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refactored GET endpoint to use queryWithRetry for fetching the latest alliance
app.get('/api/alliance', async (req, res) => {
  try {
    const result = await queryWithRetry('SELECT DISTINCT * FROM public.alliance ORDER BY "firstRaidDate" DESC FETCH FIRST 1 ROWS ONLY', []);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* app.get('/api/playerStats', async (req, res) => {
  try {
    const result = await queryWithRetry('SELECT * FROM public.player_stats', []);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); */

app.get('/api/playerStats', async (req, res) => {
  const sort = req.query.sort || 'name'; 
  const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
  const page = parseInt(req.query.page, 15) || 1;
  const limit = 10; // Set the number of items per page
  const offset = (page - 1) * limit;

  try {
    // Validate sort column
    const validSortColumns = ['name', 'race', 'avg_time', 'avg_position', 'participation', 'total_raids'];
    if (!validSortColumns.includes(sort)) {
      return res.status(400).json({ error: 'Invalid sort column', error_code: '400' });
    }

    // Query for page data
    let queryText = `SELECT * FROM public.player_stats ORDER BY ${sort} ${order} LIMIT $1 OFFSET $2`;
    const queryParams = [limit, offset];
    const dataResult = await queryWithRetry(queryText, queryParams);

    // Query for total count
    const totalCountResult = await queryWithRetry('SELECT COUNT(*) AS total_count FROM public.player_stats', []);
    const total_count = parseInt(totalCountResult.rows[0].total_count, 10);

    // Return structured response
    res.json({
      items: dataResult.rows,
      total_count: total_count,
    
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

