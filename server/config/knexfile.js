require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const connection = process.env.DATABASE_URL || {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nutrition_label',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Coolify test PostgreSQL runs without TLS; production keeps SSL by default.
const ssl = process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false };

module.exports = {
  development: {
    client: 'pg',
    connection,
    migrations: {
      directory: require('path').resolve(__dirname, '../migrations'),
    },
    seeds: {
      directory: require('path').resolve(__dirname, '../seeds'),
    },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl,
    },
    migrations: {
      directory: require('path').resolve(__dirname, '../migrations'),
    },
    seeds: {
      directory: require('path').resolve(__dirname, '../seeds'),
    },
    pool: { min: 2, max: 10 },
  },
};
