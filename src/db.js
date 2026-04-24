const { Pool } = require('pg');

let connectionString = process.env.DATABASE_URL;

if (connectionString.includes('sslmode=')) {
    connectionString = connectionString.replace(/sslmode=[^&]+/, 'sslmode=require');
} else {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;