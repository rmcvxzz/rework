/* migrate.js
This is a template file to run database updates.
Use this if you need to create new tables or modify existing ones.
To run this, execute `node src/migrate.js` from the project root.
Make sure to have your database credentials set in the .env file.
*/

import 'dotenv/config';
import pool from './db';

async function migrate(): Promise<void> {
    // put your code here
}

migrate();