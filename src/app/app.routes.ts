import { Routes } from '@angular/router';
import { AlbumList } from './album-list/album-list';

export const routes: Routes = [
  { path: '', redirectTo: 'albums', pathMatch: 'full' },
  { path: 'albums', component: AlbumList },
  { path: '**', redirectTo: 'albums' },
];
