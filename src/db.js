const { Pool } = require('pg');

let connectionString = process.env.DATABASE_URL
    .replace(/[?&]sslmode=[^&]*/g, '');

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;