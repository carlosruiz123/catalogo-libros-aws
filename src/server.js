require('dotenv/config');
const { crearPool } = require('./config/db');
const { crearLibrosRepository } = require('./repositories/librosRepository');
const { crearApp } = require('./app');

const puerto = Number(process.env.PORT || 3000);
const pool = crearPool();
const repositorio = crearLibrosRepository(pool);
const app = crearApp(repositorio);

const servidor = app.listen(puerto, '0.0.0.0', () => {
  console.log(`Catalogo de libros escuchando en el puerto ${puerto}`);
});

async function cerrarOrdenadamente() {
  servidor.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', cerrarOrdenadamente);
process.on('SIGINT', cerrarOrdenadamente);
