#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dataDir = path.resolve(__dirname, '../.db-data');
const binDir = path.resolve(__dirname, '../node_modules/@embedded-postgres/linux-x64/native/bin');
const pgCtl = path.join(binDir, 'pg_ctl');
const logFile = path.join(dataDir, 'postgres.log');

const action = process.argv[2] || 'start';

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  if (action === 'start') {
    try {
      execSync(`"${pgCtl}" -D "${dataDir}" status`, { stdio: 'ignore' });
      console.log('PostgreSQL is already running.');
    } catch {
      console.log('Starting PostgreSQL server...');
      execSync(`"${pgCtl}" -D "${dataDir}" -l "${logFile}" start`, { stdio: 'inherit' });
      console.log('PostgreSQL server started successfully on port 5432.');
    }
  } else if (action === 'stop') {
    console.log('Stopping PostgreSQL server...');
    execSync(`"${pgCtl}" -D "${dataDir}" stop`, { stdio: 'inherit' });
    console.log('PostgreSQL server stopped.');
  } else if (action === 'status') {
    execSync(`"${pgCtl}" -D "${dataDir}" status`, { stdio: 'inherit' });
  } else {
    console.log(`Usage: node scripts/db.js [start|stop|status]`);
  }
} catch (error) {
  console.error(`PostgreSQL ${action} error:`, error.message);
  process.exit(1);
}
