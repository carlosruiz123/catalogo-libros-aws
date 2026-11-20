const express = require('express');
const pkg = require('../package.json');
const { crearLibrosRouter } = require('./routes/librosRoutes');

function crearApp(repositorio) {
  const app = express();

  app.use(express.json());

  // Captura JSON malformado enviado por el cliente antes de llegar a las rutas
  app.use((err, _req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'El cuerpo JSON esta malformado' });
    }
    return next(err);
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      servicio: pkg.name,
      version: process.env.APP_VERSION || pkg.version,
      commit: process.env.COMMIT_SHA || 'local',
    });
  });

  app.use('/libros', crearLibrosRouter(repositorio));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  app.use((err, _req, res, _next) => {
    console.error('Error inesperado en la API:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { crearApp };
