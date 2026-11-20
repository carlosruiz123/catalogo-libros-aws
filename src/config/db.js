const mysql = require('mysql2/promise');

function crearPool() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  // Permite activar TLS cuando RDS exige conexiones cifradas
  if (process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }

  return mysql.createPool(config);
}

module.exports = { crearPool };
