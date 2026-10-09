# CD Inventory — Vitrina de Colección

Sitio web para explorar un inventario personal de CDs. Consume la API de álbumes
(`https://mpeh6k2fke.execute-api.us-east-1.amazonaws.com/v1/albums`) y permite:

- Buscar por **artista** o **título** (texto, con botón Buscar o Enter) o por **estado** (OK / Pendientes).
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
npm start      # http://localhost:4200
npm test
npm run build
```

## Limitación conocida: CORS

La API solo envía `Access-Control-Allow-Origin` en la respuesta al preflight `OPTIONS`,
no en la respuesta real del `GET`. Por eso los navegadores bloquean las llamadas directas.

Mientras eso no se corrija en la API:

- `npm start` levanta el dev server con un proxy (`proxy.conf.json`) que reenvía
  `/api/albums` a la API real, así que **en desarrollo local funciona**.
- Un **build de producción no funciona**: no hay proxy y la ruta relativa `/api/albums`
  no existe en un hosting estático.

Cuando la API devuelva el header CORS también en el `GET`, basta con apuntar
`ALBUMS_ENDPOINT` en `src/app/albums-api.ts` a la URL absoluta de la API.

## Estructura

```
src/app/
  album.ts             # modelo de dominio
  albums-api.ts        # cliente de la API
  album-list/          # pantalla principal (búsqueda, tabla, paginación)
fixtures/              # respuestas de ejemplo de la API
proxy.conf.json        # proxy del dev server (ver CORS)
```
