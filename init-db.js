process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('dotenv').config();
const pool = require('./src/db');

(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS players (
                id SERIAL PRIMARY KEY,
                console_id TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                quote TEXT DEFAULT 'Rework server user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            );
        `);

        console.log('Table created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();