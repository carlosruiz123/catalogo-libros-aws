# API REST Catálogo de Libros en AWS (EC2 + RDS + CI/CD)

Proyecto de práctica para gestionar un catálogo académico de libros mediante una API REST construida con Node.js y Express, conectada a Amazon RDS for MySQL, publicada con Nginx como proxy inverso en Amazon EC2 y automatizada con GitHub Actions y Docker (GHCR).

## Arquitectura y recursos de AWS

Todos los recursos de cómputo y base de datos se encuentran en la región **`us-east-1`** dentro de la misma VPC (`vpc-04116e5f940d05186`):

- **Instancia EC2 (`ec2-libros-carlosruiz`)**: Ubuntu Server (`t3.micro`), ejecuta el contenedor Docker de la API en `127.0.0.1:3000` y Nginx en el puerto `80` como proxy inverso.
- **Grupo de seguridad de EC2 (`ec2-sg-carlosruiz`)**:
  - Entrada TCP `80` desde `0.0.0.0/0` (acceso público a través de Nginx).
  - Entrada TCP `22` restringida únicamente a la IP pública de administración (y temporalmente a la IP del runner durante el despliegue).
  - Los puertos `3000` y `3306` no están expuestos a Internet.
- **Base de datos RDS (`rds-libros-carlosruiz`)**: MySQL Community `8.4.11` (`db.t4g.micro`), base de datos `libros_db`, **acceso público deshabilitado**.
- **Grupo de seguridad de RDS (`rds-sg-carlosruiz`)**:
  - Entrada TCP `3306` permitida únicamente desde el grupo de seguridad `ec2-sg-carlosruiz`.

## Endpoints disponibles

| Método y ruta | Descripción |
|---|---|
| `GET /health` | Verifica que el servicio esté activo y muestra versión/commit. |
| `GET /libros` | Lista todos los libros registrados en RDS. |
| `GET /libros/:id` | Obtiene un libro por su ID (`404` si no existe). |
| `POST /libros` | Crea un libro validando `titulo`, `autor` y `anio_publicacion` (`201` o `400`). |
| `PUT /libros/:id` | Actualiza un libro existente (`200`, `400` o `404`). |
| `DELETE /libros/:id` | Elimina un libro existente (`200` o `404`). |

## Ejecución local y pruebas

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Ejecutar pruebas automatizadas con Jest y Supertest (no requieren una instancia RDS real gracias al repositorio en memoria usado en los tests):
   ```bash
   npm test
   ```
3. Configurar variables de entorno tomando como base `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Crear la base de datos y tabla en MySQL usando `db.sql`:
   ```bash
   mysql -h <HOST> -u <USUARIO> -p < db.sql
   ```
5. Iniciar la aplicación localmente o con Docker:
   ```bash
   npm start
   ```
   O mediante contenedor:
   ```bash
   docker build -t catalogo-libros-api:local .
   docker run -d -p 127.0.0.1:3000:3000 --env-file .env catalogo-libros-api:local
   curl http://127.0.0.1:3000/health
   ```
