const fs = require('fs');
const path = require('path');

const dbDir = path.dirname(process.env.DB_PATH || './data/jishua.json');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/jishua.json';

function loadDB() {
  if (!fs.existsSync(dbPath)) {
    return { users: [], resumes: [], payments: [], ai_generations: [], admin_sessions: [] };
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
}

let dbData = loadDB();

function writeDB() {
  saveDB(dbData);
}

function nextId(arr) {
  return arr.length > 0 ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

// Mimic better-sqlite3 prepared statement API
function prepare(sql) {
  const lower = sql.toLowerCase().trim();

  // CREATE TABLE / CREATE INDEX - no-op for JSON DB (schema implicit)
  if (lower.startsWith('create table') || lower.startsWith('create index')) {
    return { run: () => ({}) };
  }

  // INSERT INTO users
  if (lower.includes('insert into users')) {
    return {
      run: (...params) => {
        const id = nextId(dbData.users);
        const row = { id };
        // Parse columns from SQL
        const match = lower.match(/insert into users \(([^)]+)\) values \(([^)]+)\)/);
        if (match) {
          const cols = match[1].split(',').map(c => c.trim());
          cols.forEach((col, i) => {
            row[col] = params[i];
          });
        }
        dbData.users.push(row);
        writeDB();
        return { lastInsertRowid: id, changes: 1 };
      }
    };
  }

  // INSERT INTO resumes
  if (lower.includes('insert into resumes')) {
    return {
      run: (...params) => {
        const id = nextId(dbData.resumes);
        const row = { id };
        const match = lower.match(/insert into resumes \(([^)]+)\) values \(([^)]+)\)/);
        if (match) {
          const cols = match[1].split(',').map(c => c.trim());
          cols.forEach((col, i) => {
            row[col] = params[i];
          });
        }
        dbData.resumes.push(row);
        writeDB();
        return { lastInsertRowid: id, changes: 1 };
      }
    };
  }

  // INSERT INTO payments
  if (lower.includes('insert into payments')) {
    return {
      run: (...params) => {
        const id = nextId(dbData.payments);
        const row = { id };
        const match = lower.match(/insert into payments \(([^)]+)\) values \(([^)]+)\)/);
        if (match) {
          const cols = match[1].split(',').map(c => c.trim());
          cols.forEach((col, i) => {
            row[col] = params[i];
          });
        }
        dbData.payments.push(row);
        writeDB();
        return { lastInsertRowid: id, changes: 1 };
      }
    };
  }

  // INSERT INTO ai_generations
  if (lower.includes('insert into ai_generations')) {
    return {
      run: (...params) => {
        const id = nextId(dbData.ai_generations);
        const row = { id };
        const match = lower.match(/insert into ai_generations \(([^)]+)\) values \(([^)]+)\)/);
        if (match) {
          const cols = match[1].split(',').map(c => c.trim());
          cols.forEach((col, i) => {
            row[col] = params[i];
          });
        }
        dbData.ai_generations.push(row);
        writeDB();
        return { lastInsertRowid: id, changes: 1 };
      }
    };
  }

  // INSERT INTO admin_sessions
  if (lower.includes('insert into admin_sessions')) {
    return {
      run: (...params) => {
        const id = nextId(dbData.admin_sessions);
        const row = { id };
        const match = lower.match(/insert into admin_sessions \(([^)]+)\) values \(([^)]+)\)/);
        if (match) {
          const cols = match[1].split(',').map(c => c.trim());
          cols.forEach((col, i) => {
            row[col] = params[i];
          });
        }
        dbData.admin_sessions.push(row);
        writeDB();
        return { lastInsertRowid: id, changes: 1 };
      }
    };
  }

  // UPDATE users
  if (lower.startsWith('update users')) {
    return {
      run: (...params) => {
        const setMatch = lower.match(/set (.+?) where/);
        const whereMatch = lower.match(/where (.+)$/);
        if (!setMatch || !whereMatch) return { changes: 0 };

        const whereCol = whereMatch[1].split('=')[0].trim();
        const whereVal = params[params.length - 1];

        let changes = 0;
        dbData.users.forEach(row => {
          if (row[whereCol] === whereVal || (whereCol === 'id' && row.id === whereVal) || (whereCol === 'email' && row.email === whereVal) || (whereCol === 'stripe_customer_id' && row.stripe_customer_id === whereVal)) {
            // Apply SETs from params (all except last is WHERE value)
            const setParts = setMatch[1].split(',').map(s => s.trim());
            setParts.forEach((part, idx) => {
              const col = part.split('=')[0].trim();
              if (params[idx] !== undefined) row[col] = params[idx];
            });
            changes++;
          }
        });
        if (changes) writeDB();
        return { changes };
      }
    };
  }

  // DELETE FROM resumes
  if (lower.startsWith('delete from resumes')) {
    return {
      run: (...params) => {
        const before = dbData.resumes.length;
        const whereMatch = lower.match(/where (.+)$/);
        if (!whereMatch) return { changes: 0 };
        // Simple AND condition parser
        const conditions = whereMatch[1].split(' and ').map(c => c.trim());
        dbData.resumes = dbData.resumes.filter(row => {
          return !conditions.every(cond => {
            const [col, val] = cond.split('=').map(s => s.trim());
            const pIdx = conditions.indexOf(cond);
            return row[col] === params[pIdx] || (col === 'id' && row.id === params[pIdx]);
          });
        });
        const changes = before - dbData.resumes.length;
        if (changes) writeDB();
        return { changes };
      }
    };
  }

  // SELECT * FROM ... WHERE ... (single row)
  if (lower.startsWith('select') && lower.includes('from') && lower.includes('where')) {
    return {
      get: (...params) => {
        let table;
        if (lower.includes('from users')) table = 'users';
        else if (lower.includes('from resumes')) table = 'resumes';
        else if (lower.includes('from payments')) table = 'payments';
        else if (lower.includes('from admin_sessions')) table = 'admin_sessions';
        else return null;

        const whereMatch = lower.match(/where (.+?)(?:order by|limit|$)/);
        if (!whereMatch) return dbData[table][0] || null;

        const conditions = whereMatch[1].split(' and ').map(c => c.trim());
        const result = dbData[table].find(row => {
          return conditions.every((cond, idx) => {
            const parts = cond.split('=').map(s => s.trim());
            const col = parts[0];
            const val = params[idx];
            if (cond.includes('>')) {
              const c = cond.split('>')[0].trim();
              return row[c] > val;
            }
            return row[col] === val || (col === 'id' && row.id === val) || (col === 'email' && row.email === val) || (col === 'stripe_customer_id' && row.stripe_customer_id === val);
          });
        });
        return result || null;
      },
      all: (...params) => {
        let table;
        if (lower.includes('from users')) table = 'users';
        else if (lower.includes('from resumes')) table = 'resumes';
        else if (lower.includes('from payments')) table = 'payments';
        else if (lower.includes('from ai_generations')) table = 'ai_generations';
        else if (lower.includes('from admin_sessions')) table = 'admin_sessions';
        else return [];

        const whereMatch = lower.match(/where (.+?)(?:order by|limit|group by|$)/);
        let result = dbData[table];

        if (whereMatch) {
          const conditions = whereMatch[1].split(' and ').map(c => c.trim());
          result = result.filter(row => {
            return conditions.every((cond, idx) => {
              const parts = cond.split('=').map(s => s.trim());
              const col = parts[0];
              const val = params[idx];
              if (cond.includes('like')) {
                const likeCol = cond.split('like')[0].trim();
                const likeVal = val.replace(/%/g, '').toLowerCase();
                return String(row[likeCol] || '').toLowerCase().includes(likeVal);
              }
              if (cond.includes('>=')) {
                const c = cond.split('>=')[0].trim();
                return new Date(row[c]) >= new Date(val);
              }
              return row[col] === val || (col === 'id' && row.id === val) || (col === 'user_id' && row.user_id === val);
            });
          });
        }

        // ORDER BY
        const orderMatch = lower.match(/order by (.+?)(?:limit|$)/);
        if (orderMatch) {
          const [col, dir] = orderMatch[1].trim().split(' ');
          result = [...result].sort((a, b) => {
            if (dir === 'desc') return String(b[col] || '') > String(a[col] || '') ? 1 : -1;
            return String(a[col] || '') > String(b[col] || '') ? 1 : -1;
          });
        }

        // LIMIT / OFFSET
        const limitMatch = lower.match(/limit (\d+)(?: offset (\d+))?/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]);
          const offset = parseInt(limitMatch[2]) || 0;
          result = result.slice(offset, offset + limit);
        }

        // GROUP BY (simple aggregation)
        const groupMatch = lower.match(/group by (.+?)(?:order by|limit|$)/);
        if (groupMatch) {
          const groupCol = groupMatch[1].trim();
          const groups = {};
          result.forEach(row => {
            const key = row[groupCol];
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
          });
          // Check for aggregation functions
          const selectMatch = lower.match(/select (.+?) from/);
          if (selectMatch) {
            const aggMatch = selectMatch[1].match(/(sum|count|avg|coalesce)\(([^)]+)\)/);
            const aliasMatch = selectMatch[1].match(/as (\w+)$/);
            return Object.entries(groups).map(([key, items]) => {
              const out = { [groupCol]: key };
              if (aggMatch) {
                const fn = aggMatch[1];
                const field = aggMatch[2].replace(/\s+/g, '');
                if (fn === 'count') out.count = items.length;
                else if (fn === 'sum') out[aliasMatch?.[1] || 'total'] = items.reduce((s, r) => s + (Number(r[field]) || 0), 0);
                else if (fn === 'avg') out.avg = items.reduce((s, r) => s + (Number(r[field]) || 0), 0) / items.length;
                else if (fn === 'coalesce') {
                  const args = field.split(',').map(s => s.trim());
                  const sumField = args[0];
                  out[aliasMatch?.[1] || 'total'] = items.reduce((s, r) => s + (Number(r[sumField]) || 0), 0);
                }
              }
              return out;
            });
          }
        }

        // SELECT specific columns
        const selectMatch = lower.match(/select (.+?) from/);
        if (selectMatch && !selectMatch[1].includes('*') && !selectMatch[1].includes('count(')) {
          const cols = selectMatch[1].split(',').map(c => {
            const m = c.trim().match(/^(\w+)\.?(\w+)?$/);
            return m ? (m[2] || m[1]) : c.trim();
          });
          return result.map(row => {
            const out = {};
            cols.forEach(col => { out[col] = row[col]; });
            return out;
          });
        }

        return result;
      }
    };
  }

  // SELECT COUNT(*)
  if (lower.startsWith('select count(*)')) {
    return {
      get: (...params) => {
        let table;
        if (lower.includes('from users')) table = 'users';
        else if (lower.includes('from resumes')) table = 'resumes';
        else if (lower.includes('from payments')) table = 'payments';
        else if (lower.includes('from ai_generations')) table = 'ai_generations';
        else return { count: 0 };

        const whereMatch = lower.match(/where (.+?)$/);
        let result = dbData[table];

        if (whereMatch) {
          const conditions = whereMatch[1].split(' and ').map(c => c.trim());
          result = result.filter(row => {
            return conditions.every((cond, idx) => {
              const parts = cond.split('=').map(s => s.trim());
              const col = parts[0];
              const val = params[idx];
              if (cond.includes('>=')) {
                const c = cond.split('>=')[0].trim();
                return new Date(row[c]) >= new Date(val);
              }
              return row[col] === val || (col === 'id' && row.id === val);
            });
          });
        }

        return { count: result.length };
      }
    };
  }

  // Generic fallback
  return {
    run: () => ({ changes: 0 }),
    get: () => null,
    all: () => []
  };
}

function initDatabase() {
  // Ensure data file exists
  if (!fs.existsSync(dbPath)) {
    saveDB({ users: [], resumes: [], payments: [], ai_generations: [], admin_sessions: [] });
  }
  console.log('Database initialized (JSON file):', dbPath);
}

// Create a db object that mimics better-sqlite3
const db = {
  prepare: prepare,
  exec: (sql) => {
    // No-op for schema creation in JSON mode
  },
  pragma: () => {}
};

function getData() { return dbData; }
function setData(newData) { dbData = newData; saveDB(); }

module.exports = { db, initDatabase, getData, setData };
