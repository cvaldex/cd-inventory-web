import { Injectable } from '@angular/core';
import { Album } from './album';

/**
 * The real API (https://mpeh6k2fke.execute-api.us-east-1.amazonaws.com/v1/albums) only sends
 * Access-Control-Allow-Origin on its OPTIONS preflight, not on the actual GET response, so
 * browsers block it cross-origin. Until that's fixed API-side, `npm start` proxies this relative
 * path to the real endpoint (see proxy.conf.json) so local dev works. A production build has no
 * such proxy and will fail the same CORS check until the API response headers are fixed.
 */
const ALBUMS_ENDPOINT = '/api/albums';

export type FilterType = 'none' | 'artist' | 'title' | 'status';

interface AlbumsResponse {
  albums: Array<{
    artist: string;
    title: string;
    type: string;
    year: string;
    notes: string;
    status: string;
    instagram: string;
    link_instagram?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class AlbumsApi {
  async search(filterType: FilterType, searchText: string): Promise<Album[]> {
    const url =
      filterType === 'none'
        ? ALBUMS_ENDPOINT
        : `${ALBUMS_ENDPOINT}?filterType=${encodeURIComponent(filterType)}&searchText=${encodeURIComponent(searchText)}`;

    let res: Response;
    try {
      res = await fetch(url, { cache: 'no-cache', referrerPolicy: 'no-referrer' });
    } catch {
      throw new Error('No se pudo conectar con la API. Verifica tu conexión e intenta de nuevo.');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.errorMessage ?? `La API respondió con un error (HTTP ${res.status}).`);
    }

    const data = (await res.json()) as AlbumsResponse;
    return data.albums.map(
      (a) =>
        new Album(
          a.artist,
          a.title,
          a.type,
          a.year,
          a.notes,
          a.status,
          a.instagram,
          a.link_instagram,
        ),
    );
  }
}
