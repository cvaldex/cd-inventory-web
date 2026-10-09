import { Component, computed, signal } from '@angular/core';

import { Album } from '../album';
import { AlbumsApi, FilterType } from '../albums-api';

type SortField = 'artist' | 'title' | 'type' | 'year';

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

  readonly needsAction = computed(() => {
    if (this.loading() || this.error()) return false;
    if (this.isTextMode()) return this.searchText().trim() === '';
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
    () => this.loading() || (this.isTextMode() && this.searchText().trim() === ''),
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
    if (event.key === 'Enter' && this.searchText().trim() !== '') {
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
    if (this.isTextMode() && this.searchText().trim() === '') return;
    if (this.filterField() === 'status' && this.statusValue() === '') return;

    this.loading.set(true);
    this.error.set(null);

    const searchText =
      this.filterField() === 'status' ? this.statusValue() : this.searchText().trim();

    try {
      const results = await this.albumsApi.search(this.filterField(), searchText);
      this.results.set(results);
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
