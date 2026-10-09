import { TestBed } from '@angular/core/testing';

import { Album } from '../album';
import { AlbumList } from './album-list';

function rawAlbum(overrides: Partial<Record<string, string>> = {}) {
  return {
    artist: 'Paul McCartney',
    title: 'McCartney',
    type: 'Estudio',
    year: '1970',
    notes: '',
    status: 'OK',
    instagram: 'no',
    ...overrides,
  };
}

function mockFetchResolved(albums: ReturnType<typeof rawAlbum>[]) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ albums }),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('AlbumList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlbumList],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty and does not fetch anything on its own', () => {
    const { componentInstance } = TestBed.createComponent(AlbumList);

    expect(componentInstance.results()).toEqual([]);
    expect(componentInstance.needsAction()).toBe(true);
  });

  it('fetches without a filterType when showing the whole catalog', async () => {
    const fetchMock = mockFetchResolved([rawAlbum()]);
    const { componentInstance } = TestBed.createComponent(AlbumList);

    await componentInstance.runSearch();

    const [url] = fetchMock.mock.calls[0];
    expect(url).not.toContain('filterType');
    expect(componentInstance.results().length).toBe(1);
    expect(componentInstance.needsAction()).toBe(false);
  });

  it('does not search by text until a non-empty value is provided', async () => {
    const fetchMock = mockFetchResolved([]);
    const { componentInstance } = TestBed.createComponent(AlbumList);
    componentInstance.onFilterFieldChange('artist');

    await componentInstance.runSearch();
    expect(fetchMock).not.toHaveBeenCalled();

    componentInstance.onSearchTextInput('mccartney');
    await componentInstance.runSearch();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('filterType=artist');
    expect(url).toContain('searchText=mccartney');
  });

  it('searches immediately once a status is selected', async () => {
    const fetchMock = mockFetchResolved([]);
    const { componentInstance } = TestBed.createComponent(AlbumList);
    componentInstance.onFilterFieldChange('status');

    componentInstance.onStatusChange('Pending');
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('filterType=status');
    expect(url).toContain('searchText=Pending');
  });

  it('shows a readable error and clears results when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const { componentInstance } = TestBed.createComponent(AlbumList);
    componentInstance.onFilterFieldChange('none');
    componentInstance.results.set([new Album('A', 'B', 'Estudio', '2000', '', 'OK', 'no')]);

    await componentInstance.runSearch();

    expect(componentInstance.error()).toBeTruthy();
    expect(componentInstance.results()).toEqual([]);
  });

  it('toggles direction on the same field and resets to asc on a new field', () => {
    const { componentInstance } = TestBed.createComponent(AlbumList);
    expect(componentInstance.sortField()).toBe('artist');
    expect(componentInstance.sortDir()).toBe('asc');

    componentInstance.toggleSort('artist');
    expect(componentInstance.sortDir()).toBe('desc');

    componentInstance.toggleSort('year');
    expect(componentInstance.sortField()).toBe('year');
    expect(componentInstance.sortDir()).toBe('asc');
  });

  it('paginates results using pageSize', () => {
    const { componentInstance } = TestBed.createComponent(AlbumList);
    const albums = Array.from(
      { length: 20 },
      (_, i) => new Album(`Artist ${i}`, `Title ${i}`, 'Estudio', '2000', '', 'OK', 'no'),
    );
    componentInstance.results.set(albums);

    expect(componentInstance.pagedResults().length).toBe(componentInstance.pageSize);
    expect(componentInstance.totalPages()).toBe(3);

    componentInstance.goToPage(1);
    expect(componentInstance.page()).toBe(2);
  });
});
