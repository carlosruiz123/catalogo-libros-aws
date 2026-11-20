const request = require('supertest');
const { crearApp } = require('../src/app');

function crearRepoMemoria(inicial = []) {
  let secuencia = inicial.length;
  const registros = inicial.map((item) => ({ ...item }));

  return {
    async listarTodos() {
      return registros.map((item) => ({ ...item }));
    },

    async buscarPorId(id) {
      const encontrado = registros.find((item) => item.id === id);
      return encontrado ? { ...encontrado } : null;
    },

    async crear({ titulo, autor, anio_publicacion }) {
      secuencia += 1;
      const nuevo = { id: secuencia, titulo, autor, anio_publicacion };
      registros.push(nuevo);
      return { ...nuevo };
    },

    async actualizar(id, { titulo, autor, anio_publicacion }) {
      const indice = registros.findIndex((item) => item.id === id);
      if (indice === -1) {
        return null;
      }
      registros[indice] = { id, titulo, autor, anio_publicacion };
      return { ...registros[indice] };
    },

    async eliminar(id) {
      const indice = registros.findIndex((item) => item.id === id);
      if (indice === -1) {
        return false;
      }
      registros.splice(indice, 1);
      return true;
    },
  };
}

describe('API REST Catalogo de Libros', () => {
  let app;

  beforeEach(() => {
    const repoPrueba = crearRepoMemoria([
      {
        id: 1,
        titulo: 'Ingenieria de Software',
        autor: 'Ian Sommerville',
        anio_publicacion: 2016,
      },
    ]);
    app = crearApp(repoPrueba);
  });

  test('GET /health responde 200 indicando que el servicio esta activo', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.servicio).toBe('catalogo-libros-api');
    expect(res.body.version).toBe('1.0.0');
  });

  test('POST /libros crea un libro valido y responde 201', async () => {
    const payload = {
      titulo: 'Clean Code',
      autor: 'Robert C. Martin',
      anio_publicacion: 2008,
    };

    const res = await request(app).post('/libros').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 2,
      titulo: 'Clean Code',
      autor: 'Robert C. Martin',
      anio_publicacion: 2008,
    });
  });

  test('POST /libros rechaza con 400 cuando faltan campos o son invalidos', async () => {
    const resTituloVacio = await request(app).post('/libros').send({
      titulo: '   ',
      autor: 'Autor Demo',
      anio_publicacion: 2022,
    });
    expect(resTituloVacio.status).toBe(400);

    const resAutorVacio = await request(app).post('/libros').send({
      titulo: 'Libro Demo',
      autor: '',
      anio_publicacion: 2022,
    });
    expect(resAutorVacio.status).toBe(400);

    const resAnioDecimal = await request(app).post('/libros').send({
      titulo: 'Libro Demo',
      autor: 'Autor Demo',
      anio_publicacion: 2022.5,
    });
    expect(resAnioDecimal.status).toBe(400);

    const resAnioTexto = await request(app).post('/libros').send({
      titulo: 'Libro Demo',
      autor: 'Autor Demo',
      anio_publicacion: '2022',
    });
    expect(resAnioTexto.status).toBe(400);
  });

  test('GET /libros lista los libros almacenados', async () => {
    const res = await request(app).get('/libros');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].titulo).toBe('Ingenieria de Software');
  });

  test('GET /libros/:id devuelve un libro existente y 404 si no existe', async () => {
    const okRes = await request(app).get('/libros/1');
    expect(okRes.status).toBe(200);
    expect(okRes.body.id).toBe(1);

    const notFoundRes = await request(app).get('/libros/999');
    expect(notFoundRes.status).toBe(404);

    const badIdRes = await request(app).get('/libros/abc');
    expect(badIdRes.status).toBe(400);
  });

  test('PUT /libros/:id actualiza un libro existente y responde 404 si no existe', async () => {
    const okRes = await request(app).put('/libros/1').send({
      titulo: 'Ingenieria de Software (10ma Edicion)',
      autor: 'Ian Sommerville',
      anio_publicacion: 2021,
    });
    expect(okRes.status).toBe(200);
    expect(okRes.body.anio_publicacion).toBe(2021);

    const badRes = await request(app).put('/libros/1').send({
      titulo: '',
      autor: 'Ian Sommerville',
      anio_publicacion: 2021,
    });
    expect(badRes.status).toBe(400);

    const notFoundRes = await request(app).put('/libros/999').send({
      titulo: 'Inexistente',
      autor: 'Nadie',
      anio_publicacion: 2020,
    });
    expect(notFoundRes.status).toBe(404);
  });

  test('DELETE /libros/:id elimina un libro y responde 404 si ya no existe', async () => {
    const delRes = await request(app).delete('/libros/1');
    expect(delRes.status).toBe(200);

    const verifyRes = await request(app).get('/libros/1');
    expect(verifyRes.status).toBe(404);

    const delAgainRes = await request(app).delete('/libros/1');
    expect(delAgainRes.status).toBe(404);
  });
});
