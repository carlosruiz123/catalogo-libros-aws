function parsearId(valor) {
  // Evita aceptar cadenas parciales como "12abc" que parseInt si dejaria pasar
  if (typeof valor === 'string' && !/^\d+$/.test(valor.trim())) {
    return null;
  }

  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    return null;
  }

  return numero;
}

function validarLibro(body) {
  const errores = [];

  if (!body || typeof body !== 'object') {
    return {
      valido: false,
      errores: ['El cuerpo de la peticion debe ser un objeto JSON valido'],
    };
  }

  const { titulo, autor, anio_publicacion } = body;

  if (typeof titulo !== 'string' || titulo.trim().length === 0) {
    errores.push('El campo "titulo" es obligatorio y no puede estar vacio');
  }

  if (typeof autor !== 'string' || autor.trim().length === 0) {
    errores.push('El campo "autor" es obligatorio y no puede estar vacio');
  }

  const anioMaximo = new Date().getFullYear() + 1;
  if (
    typeof anio_publicacion !== 'number' ||
    !Number.isInteger(anio_publicacion) ||
    anio_publicacion < 1 ||
    anio_publicacion > anioMaximo
  ) {
    errores.push(
      `El campo "anio_publicacion" debe ser un numero entero entre 1 y ${anioMaximo}`
    );
  }

  if (errores.length > 0) {
    return { valido: false, errores };
  }

  return {
    valido: true,
    datos: {
      titulo: titulo.trim(),
      autor: autor.trim(),
      anio_publicacion,
    },
  };
}

module.exports = {
  parsearId,
  validarLibro,
};
