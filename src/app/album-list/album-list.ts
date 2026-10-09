import { Component, computed, signal } from '@angular/core';

import { Album } from '../album';
import { AlbumsApi, FilterType } from '../albums-api';

type SortField = 'artist' | 'title' | 'type' | 'year';

/** The API rejects any double quote in searchText (400), so quotes are never sent nor compared. */
const stripQuotes = (value: string) => value.replaceAll('"', '');

/** Text wrapped in double quotes means "exact match"; the term itself never carries quotes. */
export function parseSearchText(raw: string): { term: string; exact: boolean } {
  const text = raw.trim();
  const exact = text.length > 2 && text.startsWith('"') && text.endsWith('"');
  return { term: stripQuotes(text).trim(), exact };
}

/** Exact match ignoring case, accents, surrounding spaces and quotes. */
function matchesExactly(value: string, term: string): boolean {
  return stripQuotes(value).trim().localeCompare(term, 'es', { sensitivity: 'base' }) === 0;
}

@Component({
  selector: 'app-album-list',
  imports: [],
  templateUrl: './album-list.html',
  styleUrl: './album-list.css',
})
export class AlbumList {
  readonly pageSize = 8;
  readonly skeletonRows = Array.from({ length: this.pageSize });

  readonly filterField = signal<FilterType>('none');
  readonly searchText = signal('');
  readonly statusValue = signal('');

  readonly sortField = signal<SortField>('artist');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly results = signal<Album[]>([]);
  readonly typeFilter = signal('');

  readonly isTextMode = computed(
    () => this.filterField() === 'artist' || this.filterField() === 'title',
  );

  readonly searchTerm = computed(() => parseSearchText(this.searchText()));

  readonly needsAction = computed(() => {
    if (this.loading() || this.error()) return false;
    if (this.isTextMode()) return this.searchTerm().term === '';
    if (this.filterField() === 'status') return this.statusValue() === '';
    return this.results().length === 0;
  });

  readonly promptMessage = computed(() => {
    switch (this.filterField()) {
      case 'artist':
        return 'Escribe el nombre de un artista y presiona Buscar.';
      case 'title':
        return 'Escribe parte de un título y presiona Buscar.';
      case 'status':
        return 'Selecciona un estado para ver esos álbumes.';
      default:
        return 'Usa los filtros de arriba para buscar en tu colección de CDs.';
    }
  });

  readonly actionVisible = computed(() => this.filterField() !== 'status');
  readonly actionLabel = computed(() =>
    this.filterField() === 'none' ? 'Ver todo el catálogo' : 'Buscar',
  );
  readonly actionDisabled = computed(
    () => this.loading() || (this.isTextMode() && this.searchTerm().term === ''),
  );

  readonly hasResults = computed(
    () => !this.loading() && !this.error() && !this.needsAction() && this.results().length > 0,
  );

  readonly availableTypes = computed(() => {
    const types = new Set(this.results().map((a) => a.type));
    return [...types].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  });

  readonly typeFilteredResults = computed(() => {
    const type = this.typeFilter();
    return type === '' ? this.results() : this.results().filter((a) => a.type === type);
  });

  readonly sortedResults = computed(() => {
    const field = this.sortField();
    const dir = this.sortDir();
    return [...this.typeFilteredResults()].sort((a, b) => {
      const c = this.compare(a, b, field);
      return dir === 'asc' ? c : -c;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedResults().length / this.pageSize)),
  );

  readonly pagedResults = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.sortedResults().slice(start, start + this.pageSize);
  });

  constructor(private readonly albumsApi: AlbumsApi) {}

  onFilterFieldChange(value: string): void {
    this.filterField.set(value as FilterType);
    this.searchText.set('');
    this.statusValue.set('');
    this.typeFilter.set('');
    this.results.set([]);
    this.error.set(null);
    this.page.set(1);
  }

  onTypeFilterChange(value: string): void {
    this.typeFilter.set(value);
    this.page.set(1);
  }

  onSearchTextInput(value: string): void {
    this.searchText.set(value);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.searchTerm().term !== '') {
      void this.runSearch();
    }
  }

  onStatusChange(value: string): void {
    this.statusValue.set(value);
    if (value !== '') {
      void this.runSearch();
    }
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  goToPage(delta: number): void {
    const next = this.page() + delta;
    if (next >= 1 && next <= this.totalPages()) {
      this.page.set(next);
    }
  }

  retry(): void {
    void this.runSearch();
  }

  async runSearch(): Promise<void> {
    const field = this.filterField();
    const { term, exact } = this.searchTerm();
    if (this.isTextMode() && term === '') return;
    if (field === 'status' && this.statusValue() === '') return;

    this.loading.set(true);
    this.error.set(null);

    const searchText = field === 'status' ? this.statusValue() : term;

    try {
      // An exact search asks the API for the substring and narrows the candidates here.
      const results = await this.albumsApi.search(field, searchText);
      this.results.set(
        exact && (field === 'artist' || field === 'title')
          ? results.filter((a) => matchesExactly(a[field], term))
          : results,
      );
      this.typeFilter.set('');
      this.page.set(1);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo completar la búsqueda.');
      this.results.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private compare(a: Album, b: Album, field: SortField): number {
    if (field === 'year') {
      return parseInt(a.year, 10) - parseInt(b.year, 10);
    }
    return a[field].localeCompare(b[field], 'es', { sensitivity: 'base' });
  }
}
