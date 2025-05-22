import fetch from 'node-fetch';
import pg from 'pg';

const { Pool } = pg;

// Update these with your DB credentials
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'chatadmin',
  password: 'StrongPassword123!',
  database: 'solana_chat',
});

const TOKEN_LIST_URL = 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json';

async function importTokens() {
  try {
    const res = await fetch(TOKEN_LIST_URL);
    const data = await res.json();
    const tokens = data.tokens;

    let inserted = 0, skipped = 0;
    for (const token of tokens) {
      try {
        await pool.query(
          `INSERT INTO token_metadata (address, symbol, name, decimals, logo_uri)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (address) DO NOTHING`,
          [
            token.address,
            token.symbol,
            token.name,
            token.decimals,
            token.logoURI || null
          ]
        );
        inserted++;
      } catch (e) {
        skipped++;
      }
    }
    console.log(`Done! Inserted: ${inserted}, Skipped: ${skipped}`);
  } catch (err) {
    console.error('Failed to import tokens:', err);
  } finally {
    await pool.end();
  }
}

importTokens(); 