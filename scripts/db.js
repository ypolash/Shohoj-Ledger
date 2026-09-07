#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const dataDir = path.resolve(__dirname, '../.db-data');
const logFile = path.join(dataDir, 'postgres.log');
const action = process.argv[2] || 'start';

function isPortOpen(port = 5432, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function findBinary(name) {
  const isWin = process.platform === 'win32';
  const exeName = isWin ? `${name}.exe` : name;

  const platformPkg = isWin
    ? 'windows-x64'
    : process.platform === 'darwin'
    ? `darwin-${process.arch}`
    : `linux-${process.arch}`;

  const candidates = [
    path.resolve(__dirname, `../node_modules/@embedded-postgres/${platformPkg}/native/bin`, exeName),
    path.resolve(__dirname, '../node_modules/@embedded-postgres/windows-x64/native/bin', exeName),
    path.resolve(__dirname, '../node_modules/@embedded-postgres/linux-x64/native/bin', exeName),
  ];

  if (isWin) {
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    for (const v of ['18', '17', '16', '15', '14']) {
      candidates.push(path.join(programFiles, `PostgreSQL\\${v}\\bin`, exeName));
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    const checkCmd = isWin ? `where ${exeName}` : `which ${name}`;
    const result = execSync(checkCmd, { stdio: 'pipe' }).toString().trim().split(/\r?\n/)[0];
    if (result && fs.existsSync(result)) {
      return result;
    }
  } catch {
    // not in PATH
  }

  return null;
}

async function main() {
  if (action === 'start') {
    const open = await isPortOpen(5432);
    if (open) {
      console.log('PostgreSQL is already running on port 5432.');
      return;
    }

    const pgCtl = findBinary('pg_ctl');
    const initdb = findBinary('initdb');

    if (!pgCtl) {
      console.warn('⚠️ No PostgreSQL binary (pg_ctl) found, and port 5432 is not open.');
      console.warn('If you have PostgreSQL installed or running in Docker, ensure it is started.');
      return;
    }

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const pgVersionFile = path.join(dataDir, 'PG_VERSION');
    if (!fs.existsSync(pgVersionFile)) {
      if (initdb) {
        console.log('Initializing PostgreSQL database cluster in .db-data...');
        execSync(`"${initdb}" -D "${dataDir}" -U postgres -A trust`, { stdio: 'inherit' });
      } else {
        console.log('Initializing PostgreSQL cluster using pg_ctl...');
        execSync(`"${pgCtl}" initdb -D "${dataDir}" -o "-U postgres -A trust"`, { stdio: 'inherit' });
      }
    }

    console.log('Starting PostgreSQL server...');
    execSync(`"${pgCtl}" -D "${dataDir}" -l "${logFile}" start`, { stdio: 'inherit' });
    console.log('PostgreSQL server started successfully on port 5432.');
  } else if (action === 'stop') {
    const pgCtl = findBinary('pg_ctl');
    if (!pgCtl) {
      console.warn('Cannot stop PostgreSQL: pg_ctl not found.');
      return;
    }
    console.log('Stopping PostgreSQL server...');
    try {
      execSync(`"${pgCtl}" -D "${dataDir}" stop`, { stdio: 'inherit' });
      console.log('PostgreSQL server stopped.');
    } catch (e) {
      console.warn('PostgreSQL stop note:', e.message);
    }
  } else if (action === 'status') {
    const open = await isPortOpen(5432);
    console.log(`Port 5432 status: ${open ? 'LISTENING (PostgreSQL is running)' : 'NOT LISTENING'}`);
    const pgCtl = findBinary('pg_ctl');
    if (pgCtl && fs.existsSync(dataDir)) {
      try {
        execSync(`"${pgCtl}" -D "${dataDir}" status`, { stdio: 'inherit' });
      } catch {}
    }
  } else {
    console.log(`Usage: node scripts/db.js [start|stop|status]`);
  }
}

main().catch((error) => {
  console.error(`PostgreSQL ${action} error:`, error.message);
  process.exit(1);
});

