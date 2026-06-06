// SPDX-FileCopyrightText: 2021 and later, Protomaps LLC and contributors, modifications by Lars Maxfield
// SPDX-License-Identifier: BSD-3-Clause
// From https://github.com/protomaps/PMTiles/blob/main/app/src/tileset.ts
//
// A TileJSON or a .pmtiles archive; local, relative, or remote
// Retrieve metadata, tiles, and other information.

import { FileSource, PMTiles, TileType } from "pmtiles";

interface VectorLayer {
  id: string;
}

interface Metadata {
  type?: string;
  vector_layers: VectorLayer[];
}

interface Tileset {
  getZxy(z: number, x: number, y: number): Promise<ArrayBuffer | undefined>;
  getMetadata(): Promise<Metadata>;
  get maplibreSourceUrl(): string;
  getBounds(): Promise<[number, number, number, number]>;
  getMaxZoom(): Promise<number>;

  getVectorLayers(): Promise<string[]>;
  getVectorEncoding(): Promise<"mvt" | "mlt" | undefined>;
  isOverlay(): Promise<boolean>;
  isVector(): Promise<boolean>;

  test(): Promise<void>;
}

export interface Remote {
  get stateUrl(): string;
}

export interface Relative {
  get stateUrl(): string;
}

export interface Local {
  get filename(): string;
}

export class PMTilesTileset implements Tileset {
  archive: PMTiles;

  constructor(p: PMTiles) {
    this.archive = p;
  }

  get maplibreSourceUrl() {
    return `pmtiles://${this.archive.source.getKey()}`;
  }

  async getZxy(z: number, x: number, y: number) {
    const resp = await this.archive.getZxy(z, x, y);
    if (resp) return resp.data;
  }

  async getBounds(): Promise<[number, number, number, number]> {
    const h = await this.getHeader();
    return [h.minLon, h.minLat, h.maxLon, h.maxLat];
  }

  async getMaxZoom(): Promise<number> {
    const h = await this.getHeader();
    return h.maxZoom;
  }

  async isVector() {
    const h = await this.getHeader();
    return h.tileType === TileType.Mvt || h.tileType === TileType.Mlt;
  }

  async getHeader() {
    return await this.archive.getHeader();
  }

  async test() {
    await this.archive.getHeader();
  }

  async getMetadata() {
    return (await this.archive.getMetadata()) as Metadata;
  }

  async isOverlay() {
    const m = await this.getMetadata();
    return m.type === "overlay";
  }

  async getVectorLayers() {
    const m = await this.getMetadata();
    return m.vector_layers.map((l) => l.id);
  }

  async getVectorEncoding() {
    const h = await this.getHeader();
    if (h.tileType === TileType.Mvt) return "mvt";
    if (h.tileType === TileType.Mlt) return "mlt";
    return undefined;
  }
}

class RemotePMTilesTileset extends PMTilesTileset implements Remote {
  url: string;

  constructor(url: string) {
    super(new PMTiles(url));
    this.url = url;
  }

  get stateUrl () {
    return this.url;
  }
}

class LocalPMTilesTileset extends PMTilesTileset implements Local {
  file: File;

  constructor(file: File) {
    super(new PMTiles(new FileSource(file)));
    this.file = file;
  }

  get filename() {
    return this.file.name;
  }

  // TODO: Add knowledge that this must be added to protocol with protocol.add(<this>.archive)?
  // shouldBeAdded()?
  // x instanceof LocalPMTilesTileset
}

class TileJSONTileset implements Tileset, Remote {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  async test() {
    await fetch(this.url);
  }

  async getBounds() {
    const resp = await fetch(this.url);
    const j = await resp.json();
    return j.bounds as [number, number, number, number];
  }

  async getMaxZoom() {
    const resp = await fetch(this.url);
    const j = await resp.json();
    return j.maxzoom;
  }

  get maplibreSourceUrl() {
    return this.url;
  }

  async isOverlay() {
    return true;
  }

  async isVector() {
    const resp = await fetch(this.url);
    const j = await resp.json();
    const template = j.tiles[0];
    const pathname = new URL(template).pathname;
    return (
      pathname.endsWith(".pbf") ||
      pathname.endsWith(".mvt") ||
      pathname.endsWith(".mlt")
    );
  }

  get stateUrl() {
    return this.url;
  }

  async getZxy(z: number, x: number, y: number) {
    const resp = await fetch(this.url);
    const j = await resp.json();
    const template = j.tiles[0];
    const tileURL = template
      .replace("{z}", z)
      .replace("{x}", x)
      .replace("{y}", y);
    const tileResp = await fetch(tileURL);
    return await tileResp.arrayBuffer();
  }

  async getMetadata() {
    const resp = await fetch(this.url);
    return await resp.json();
  }

  async getVectorLayers() {
    const metadata = await this.getMetadata();
    return metadata.vector_layers.map((l: VectorLayer) => l.id);
  }

  async getVectorEncoding() {
    const resp = await fetch(this.url);
    const j = await resp.json();
    const template = j.tiles[0];
    const pathname = new URL(template).pathname;
    if (pathname.endsWith(".mlt")) return "mlt";
    return "mvt";
  }
}

// TODO: Implement RelativePMTilesTileset

// from a input box or a URL param state.
export const tilesetFromString = (url: string): Tileset => {
  const parsed = new URL(url);
  if (parsed.pathname.endsWith(".json")) {
    return new TileJSONTileset(url);
  }
  // TODO: if relative or if remote
  return new RemotePMTilesTileset(url);
};

export const pmtilesTilesetFromFile = (file: File): LocalPMTilesTileset => {
  return new LocalPMTilesTileset(file);
};
