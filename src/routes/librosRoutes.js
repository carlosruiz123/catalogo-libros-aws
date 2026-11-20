const express = require('express');
const { parsearId, validarLibro } = require('../utils/validarLibro');

function crearLibrosRouter(repositorio) {
  const router = express.Router();

  router.get('/', async (_req, res, next) => {
    try {
      const libros = await repositorio.listarTodos();
      return res.status(200).json(libros);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'El identificador debe ser un entero positivo' });
      }

      const libro = await repositorio.buscarPorId(id);
      if (!libro) {
        return res.status(404).json({ error: 'Libro no encontrado' });
      }

      return res.status(200).json(libro);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const validacion = validarLibro(req.body);
      if (!validacion.valido) {
        return res.status(400).json({
          error: 'Datos de libro invalidos',
          detalles: validacion.errores,
        });
      }

      const nuevoLibro = await repositorio.crear(validacion.datos);
      return res.status(201).json(nuevoLibro);
    } catch (error) {
      return next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'El identificador debe ser un entero positivo' });
      }

      const validacion = validarLibro(req.body);
      if (!validacion.valido) {
        return res.status(400).json({
          error: 'Datos de libro invalidos',
          detalles: validacion.errores,
        });
      }

      const actualizado = await repositorio.actualizar(id, validacion.datos);
      if (!actualizado) {
        return res.status(404).json({ error: 'Libro no encontrado' });
      }

      return res.status(200).json(actualizado);
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'El identificador debe ser un entero positivo' });
      }

      const eliminado = await repositorio.eliminar(id);
      if (!eliminado) {
        return res.status(404).json({ error: 'Libro no encontrado' });
      }

      return res.status(200).json({ mensaje: 'Libro eliminado', id });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { crearLibrosRouter };
