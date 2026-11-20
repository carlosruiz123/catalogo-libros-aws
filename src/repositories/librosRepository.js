function crearLibrosRepository(pool) {
  return {
    async listarTodos() {
      const [filas] = await pool.query(
        'SELECT id, titulo, autor, anio_publicacion FROM libros ORDER BY id ASC'
      );
      return filas;
    },

    async buscarPorId(id) {
      const [filas] = await pool.query(
        'SELECT id, titulo, autor, anio_publicacion FROM libros WHERE id = ?',
        [id]
      );
      return filas[0] || null;
    },

    async crear({ titulo, autor, anio_publicacion }) {
      const [resultado] = await pool.query(
        'INSERT INTO libros (titulo, autor, anio_publicacion) VALUES (?, ?, ?)',
        [titulo, autor, anio_publicacion]
      );
      return {
        id: resultado.insertId,
        titulo,
        autor,
        anio_publicacion,
      };
    },

    async actualizar(id, { titulo, autor, anio_publicacion }) {
      const [resultado] = await pool.query(
        'UPDATE libros SET titulo = ?, autor = ?, anio_publicacion = ? WHERE id = ?',
        [titulo, autor, anio_publicacion, id]
      );

      if (resultado.affectedRows === 0) {
        return null;
      }

      return { id, titulo, autor, anio_publicacion };
    },

    async eliminar(id) {
      const [resultado] = await pool.query(
        'DELETE FROM libros WHERE id = ?',
        [id]
      );
      return resultado.affectedRows > 0;
    },
  };
}

module.exports = { crearLibrosRepository };
