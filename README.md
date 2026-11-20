# API REST Catálogo de Libros en AWS (EC2 + RDS + CI/CD)

API REST académica para gestionar un catálogo de libros construida con Node.js y Express, conectada a Amazon RDS (MySQL), servida en Amazon EC2 detrás de Nginx y desplegada de forma continua con GitHub Actions y Docker (GitHub Container Registry).

## Despliegue y enlaces verificables

- **URL pública de la API**: http://3.84.181.23
  - Estado del servicio: http://3.84.181.23/health
  - Catálogo de libros: http://3.84.181.23/libros
- **Ejecución exitosa de CI (`main`)**: https://github.com/carlosruiz123/catalogo-libros-aws/actions/runs/44646299688
- **Ejecución exitosa de CI en Pull Request (`#1`, sin despliegue)**: https://github.com/carlosruiz123/catalogo-libros-aws/actions/runs/44646242890
- **Ejecución exitosa de CD (`main`, pruebas, imagen con SHA y despliegue en EC2)**: https://github.com/carlosruiz123/catalogo-libros-aws/actions/runs/44646299415
- **Imagen Docker pública en GHCR**: https://github.com/users/carlosruiz123/packages/container/package/catalogo-libros-aws

## Recursos de AWS utilizados

Todos los recursos se encuentran activos en la región **`us-east-1`** dentro de la misma VPC (`vpc-04116e5f940d05186`):

| Recurso | Identificador / Nombre | Configuración principal |
|---|---|---|
| Instancia EC2 | `ec2-libros-carlosruiz` (`i-08aa38234e2bf7927`) | Ubuntu Server 26.04 (`t3.micro`), IP pública `3.84.181.23`, Nginx en el puerto `80` como proxy hacia `127.0.0.1:3000` |
| Grupo de seguridad EC2 | `ec2-sg-carlosruiz` (`sg-0b4c70149c5465dca`) | TCP `80` abierto a `0.0.0.0/0`; TCP `22` restringido a la IP pública de administración (y temporalmente a la IP del runner durante el CD). Puerto `3000` cerrado |
| Instancia RDS | `rds-libros-carlosruiz` | MySQL Community `8.4.11` (`db.t4g.micro`), base de datos `libros_db`, **acceso público deshabilitado** (`Accesible públicamente: No`) |
| Grupo de seguridad RDS | `rds-sg-carlosruiz` (`sg-01b8463e2c0c5e247`) | Entrada TCP `3306` permitida únicamente desde el grupo de seguridad `ec2-sg-carlosruiz` (`sg-0b4c70149c5465dca`) |

## Endpoints y validaciones

| Método y ruta | Comportamiento |
|---|---|
| `GET /health` | Devuelve `200` con estado, nombre del servicio, versión (`1.1.0`), campo `despliegue` y el SHA del commit desplegado. |
| `GET /libros` | Lista todos los libros almacenados en RDS. |
| `GET /libros/:id` | Devuelve un libro por ID; responde `404` si no existe o `400` si el ID no es un entero positivo. |
| `POST /libros` | Crea un libro validando que `titulo` y `autor` no estén vacíos y `anio_publicacion` sea entero; responde `201` o `400`. |
| `PUT /libros/:id` | Actualiza un libro existente (`200`), `400` ante datos inválidos o `404` si el ID no existe. |
| `DELETE /libros/:id` | Elimina un libro existente (`200`) o responde `404` si no existe. |

Todas las consultas SQL utilizan placeholders parametrizados (`?`) mediante `mysql2/promise` ([src/repositories/librosRepository.js](src/repositories/librosRepository.js)) y reciben las credenciales desde variables de entorno ([src/config/db.js](src/config/db.js)).

## Ejecución local y pruebas

### 1. Instalación y pruebas automatizadas (sin RDS real)

Las pruebas con Jest y Supertest ([tests/libros.test.js](tests/libros.test.js)) inyectan un repositorio en memoria en `crearApp(repositorio)`, por lo que se ejecutan sin depender de MySQL/RDS:

```bash
npm ci
npm test
```

### 2. Base de datos y ejecución local con Node.js

1. Crea la base de datos y la tabla `libros` ejecutando [db.sql](db.sql):
   ```bash
   mysql -h <HOST_MYSQL> -u <USUARIO> -p < db.sql
   ```
2. Copia [.env.example](.env.example) a `.env` y completa los valores reales (el archivo `.env` está excluido en `.gitignore`):
   ```bash
   cp .env.example .env
   npm start
   ```

### 3. Construcción y prueba local con Docker

```bash
docker build -t catalogo-libros-api:local .
docker run -d --name api-libros-local \
  -p 127.0.0.1:3000:3000 \
  --env-file .env \
  catalogo-libros-api:local

curl -i http://127.0.0.1:3000/health
docker rm -f api-libros-local
```

## Flujo de CI/CD con GitHub Actions

- **CI ([.github/workflows/ci.yml](.github/workflows/ci.yml))**: se ejecuta en cada `push` y `pull_request` hacia `main`. Instala dependencias con `npm ci` y corre `npm test`; si falla una prueba, marca la ejecución como fallida.
- **CD ([.github/workflows/cd.yml](.github/workflows/cd.yml))**: se ejecuta **únicamente** en `push` a `main` (nunca en `pull_request`) mediante tres trabajos dependientes:
  1. `test`: ejecuta `npm ci` y `npm test`.
  2. `build_and_push`: construye la imagen con `Dockerfile` y la publica en `ghcr.io/carlosruiz123/catalogo-libros-aws:<SHA>` y `:latest`.
  3. `deploy`: abre temporalmente el puerto `22` en `ec2-sg-carlosruiz` solo para la IP del runner, se conecta por SSH a EC2, descarga la imagen etiquetada con el SHA, mantiene la configuración de RDS en `/opt/catalogo-libros/.env` fuera del repositorio y de la imagen, levanta el contenedor ligado exclusivamente a `127.0.0.1:3000` detrás de Nginx y verifica `GET /health` y `GET /libros`. Si la verificación falla, restaura el contenedor anterior y falla el workflow. Finalmente revoca la regla SSH temporal (`if: always()`).
- **Secrets configurados en GitHub Actions**: `GHCR_USERNAME`, `GHCR_TOKEN`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` y `EC2_SECURITY_GROUP_ID`.
- **Demostración de despliegue continuo**: mediante el Pull Request `#1` se actualizó la versión de `1.0.0` a `1.1.0` agregando `"despliegue": "cd-github-actions"` en `GET /health`. El PR ejecutó solo CI, y al fusionarse en `main` el CD publicó y desplegó la nueva imagen en EC2.

## Verificación del despliegue con `curl`

```bash
# 1. Salud del servicio (v1.1.0 desplegada por CD)
curl -i http://3.84.181.23/health

# 2. Crear libro
curl -i -X POST http://3.84.181.23/libros \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Cien Anos de Soledad","autor":"Gabriel Garcia Marquez","anio_publicacion":1967}'

# 3. Validacion 400 ante datos invalidos
curl -i -X POST http://3.84.181.23/libros \
  -H "Content-Type: application/json" \
  -d '{"titulo":"","autor":"Autor","anio_publicacion":"2020"}'

# 4. Consultar catalogo y por ID
curl -i http://3.84.181.23/libros
curl -i http://3.84.181.23/libros/2

# 5. Actualizar y eliminar
curl -i -X PUT http://3.84.181.23/libros/1 \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Cien Anos de Soledad (Edicion Conmemorativa)","autor":"Gabriel Garcia Marquez","anio_publicacion":2007}'
curl -i -X DELETE http://3.84.181.23/libros/1

# 6. Confirmar que el puerto 3000 no esta expuesto directamente a Internet
curl --max-time 4 http://3.84.181.23:3000/health
```

## Evidencias

Todas las capturas solicitadas se encuentran en la carpeta [evidencias/](evidencias):

| Archivo | Contenido verificado |
|---|---|
| [01-ec2-instancia.png](evidencias/01-ec2-instancia.png) | Instancia EC2 `ec2-libros-carlosruiz` en ejecución, VPC e IP pública |
| [02-ec2-security-group.png](evidencias/02-ec2-security-group.png) | Grupo de seguridad de EC2 (`HTTP 80` público y `SSH 22` solo desde mi IP pública) |
| [03-rds-sin-acceso-publico.png](evidencias/03-rds-sin-acceso-publico.png) | Instancia RDS `rds-libros-carlosruiz` en la misma VPC con `Accesible públicamente: No` |
| [04-rds-security-group.png](evidencias/04-rds-security-group.png) | Grupo de seguridad de RDS (`TCP 3306` únicamente desde `ec2-sg-carlosruiz`) |
| [05-crud-curl-y-persistencia-rds.png](evidencias/05-crud-curl-y-persistencia-rds.png) | Operaciones CRUD con `curl`, consulta directa `SELECT * FROM libros` en RDS, puerto `3000` bloqueado y respuesta `v1.1.0` |
| [06-pruebas-jest-supertest-docker.png](evidencias/06-pruebas-jest-supertest-docker.png) | Ejecución de `npm test` (Jest + Supertest sin RDS), `docker build` y prueba local en `/health` |
| [07-github-actions-ci.png](evidencias/07-github-actions-ci.png) | Ejecución exitosa del workflow de CI en GitHub Actions |
| [08-ghcr-imagen-publicada.png](evidencias/08-ghcr-imagen-publicada.png) | Imagen Docker publicada en GHCR etiquetada con el SHA del commit |
| [09-github-actions-cd-despliegue.png](evidencias/09-github-actions-cd-despliegue.png) | Ejecución exitosa del workflow de CD (`test` -> `build_and_push` -> `deploy`) |
