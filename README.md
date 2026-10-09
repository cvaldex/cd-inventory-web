# CD Inventory — Vitrina de Colección

Sitio web para explorar un inventario personal de CDs. Consume la API de álbumes
(`https://mpeh6k2fke.execute-api.us-east-1.amazonaws.com/v1/albums`) y permite:

- Buscar por **artista** o **título** (texto, con botón Buscar o Enter) o por **estado** (OK / Pendientes).
  Si el texto va **entre comillas** (`"ram"`), solo devuelve coincidencias exactas, sin distinguir
  mayúsculas ni acentos. Sin comillas, busca el texto en cualquier parte del campo.
- Ver el **catálogo completo** con una acción explícita (no se carga nada al entrar).
- Filtrar los resultados por **tipo** (Estudio, Live, Single, etc.).
- **Ordenar** haciendo clic en las columnas Artista, Título, Tipo y Año.
- Paginar los resultados (8 por página).
- Ver la **observación** de un álbum, cuando existe, en un tooltip junto al título.

## Stack

- Angular 22 con componentes standalone y signals
- TypeScript 6, `fetch` nativo (sin `HttpClient`)
- CSS plano con custom properties, sin librería de UI
- Vitest + jsdom para los tests
- Prettier para el formato

## Desarrollo

Requiere Node `24.20.0` (ver `.nvmrc`).

```bash
npm install
npm start            # http://localhost:4200
npm test
npm run build-prod   # build de producción para GitHub Pages
```

La app llama a la API directamente desde el navegador. La API responde con
`Access-Control-Allow-Origin: *`, tanto en las respuestas exitosas como en los errores 400.

## Despliegue

Cada push a `main` ejecuta `.github/workflows/deploy.yml`: corre los tests, hace el build
de producción y lo publica en la rama `gh-pages`. El sitio queda en
<https://cvaldex.github.io/cd-inventory-web/>.

## Estructura

```
src/app/
  album.ts             # modelo de dominio
  albums-api.ts        # cliente de la API
  album-list/          # pantalla principal (búsqueda, tabla, paginación)
fixtures/              # respuestas de ejemplo de la API
.github/workflows/     # despliegue a GitHub Pages
```
