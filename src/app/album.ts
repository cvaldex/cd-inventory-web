export class Album {
  constructor(
    public artist: string,
    public title: string,
    public type: string,
    public year: string,
    public notes: string,
    public status: string,
    public instagram: string,
    public linkInstagram?: string,
  ) {}
}
