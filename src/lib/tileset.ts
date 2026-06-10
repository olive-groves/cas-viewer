// SPDX-FileCopyrightText: 2021 and later, Protomaps LLC and contributors, modifications by Lars Maxfield
// SPDX-License-Identifier: BSD-3-Clause
// From https://github.com/protomaps/PMTiles/blob/main/app/src/tileset.ts
//
// A TileJSON or a .pmtiles archive; local, relative, or remote
// Retrieve metadata, tiles, and other information.

import {
  FileSource,
  PMTiles,
  TileType,
} from "pmtiles";
import type { Header as PMTilesHeader } from "pmtiles";
import type { Coordinates, Coordinates as MapLibreCoordinates } from 'maplibre-gl';

type MaybePromise<T> = T | Promise<T>;

type SingleFormat = "jpeg" | "jpg" | "png" | "webp";
type TiledFormat = "pmtiles" | "zyx" | "dzi" | "json";

// TODO: MapLibre adapter
// get maplibreSourceUrl(): string;

// TODO: Layer
// layerType: "basemap" | "overlay" | undefined;

// God interface that hold all of it. For now we'll use this, then abstract later if needed.
interface Source {
  url?: string;  // Reactive?
  stateUrl?: string;  // For persistent, remote URLs?

  format: string | undefined;  // jpeg pmtiles json etc.
  type:  MaybePromise<string | undefined>;  // vector raster text etc.

  file?: File;  // Get name from file.name
  archive?: unknown;  // Data-archive based (PMTiles)

  header?: MaybePromise<unknown>;  //  Promise<Header>
  metadata?: MaybePromise<unknown>;  //  Promise<unknown>
}

interface ImageSource extends Source {
  type: MaybePromise<"raster" | "vector" | undefined>;
}

interface VectorType {
  getVectorEncoding(): MaybePromise<"mvt" | "mlt" | undefined>;
  getVectorLayers(): MaybePromise<string[] | undefined>;
}

interface TilesetSource extends Source {
  getZxy(z: number, x: number, y: number): MaybePromise<ArrayBuffer | undefined>;
  getBounds(): MaybePromise<[number, number, number, number]>;
  getMaxZoom(): MaybePromise<number>;
}


type PMTilesMetadata = {
  type?: string;
  vector_layers?: {id: string}[];
};

export class StaticImage implements ImageSource {
  type: "raster" = "raster";
  format: "jpeg" | "jpg" | "png" | "webp" | undefined;
  url: string;
  constructor(url: string) {
    this.url = url;
  }
}

export class RemoteStaticImage extends StaticImage {
  constructor(url: string) {
    super(url);
  }
}

export class LocalStaticImage extends StaticImage {
  file: File;
  constructor(file: File) {
    const url = URL.createObjectURL(file);
    super(url);
    this.file = file;
  }
}

export class PMTilesTileset implements ImageSource, TilesetSource, VectorType {
  format = "pmtiles";
  archive: PMTiles;
  type: ImageSource["type"];
  header: MaybePromise<PMTilesHeader>;
  metadata: MaybePromise<PMTilesMetadata>;

  constructor(archive: PMTiles) {
    this.archive = archive;
    this.header = this._initializeHeader();
    this.metadata = this._initializeMetadata();
  }

  private async _initializeHeader() {
    const header = await this.getHeader();
    this.header = header;
    return header;
  }

  private async _initializeMetadata() {
    const metadata = (await this.getMetadata()) as PMTilesMetadata;
    this.metadata = metadata;
    return metadata;
  }

  // maplibre URL is different my guy
  // get maplibreSourceUrl() {
  //   return `pmtiles://${this.archive.source.getKey()}`;
  // }
  // url: string | undefined = $derived(this.pmtiles?.source ? `pmtiles://${this.pmtiles.source?.getKey()}` : undefined)

  async getZxy(z: number, x: number, y: number) {
    const resp = await this.archive.getZxy(z, x, y);
    return resp?.data;
  }

  async getBounds(): Promise<[number, number, number, number]> {
    const h = await this.header;
    return [h.minLon, h.minLat, h.maxLon, h.maxLat];
  }

  async getMaxZoom(): Promise<number> {
    const h = await this.header;
    return h.maxZoom;
  }

  async isVector() {
    const h = await this.header;
    return h.tileType === TileType.Mvt || h.tileType === TileType.Mlt;
  }

  async getHeader() {
    return await this.archive.getHeader();
  }

  async test() {
    await this.archive.getHeader();
  }

  async getMetadata() {
    return await this.archive.getMetadata();
  }

  async isOverlay() {
    const m = await this.metadata;
    return m.type === "overlay";
  }

  async getVectorLayers() {
    const m = await this.metadata;
    return m.vector_layers?.map((layer: {id: string}) => layer.id);
  }

  async getVectorEncoding() {
    const h = await this.header;
    switch (h.tileType) {
      case TileType.Mvt:
        return "mvt";
      case TileType.Mlt:
        return "mlt";
      default:
        return undefined;
    }
  }
}

export class RemotePMTilesTileset extends PMTilesTileset {
  url: string;

  constructor(url: string) {
    super(new PMTiles(url));
    this.url = url;
  }

  get stateUrl() {
    return this.url;
  }
}

export class LocalPMTilesTileset extends PMTilesTileset {
  file: File;
  url: string;

  constructor(file: File) {
    super(new PMTiles(new FileSource(file)));
    this.file = file;
    this.url = URL.createObjectURL(file);
  }

  get filename() {
    return this.file.name;
  }

  destroy() {
    URL.revokeObjectURL(this.url);
  }

  // TODO: Add knowledge that this must be added to protocol with protocol.add(<this>.archive)?
  // shouldBeAdded()?
  // x instanceof LocalPMTilesTileset
}

interface MapLibreBaseSourceSpec {
  type: MaybePromise<string>,
  url?: MaybePromise<string>,
  tiles?: MaybePromise<string[]>,
  bounds?: MaybePromise<[number, number, number, number]>,
  minzoom?: MaybePromise<number>,
  maxzoom?: MaybePromise<number>,
  tileSize?: MaybePromise<number>,
  scheme?: MaybePromise<"xyz"|"tms">,
  attribution?: MaybePromise<string>,
}

class MapLibreRasterSourceSpec implements MapLibreBaseSourceSpec {
  type = "raster";
}
class MapLibreRasterDemSourceSpec implements MapLibreBaseSourceSpec {
  type = "raster-dem";
  encoding?: "terrarium" | "mapbox" | "custom";
  redFactor?: number;
  blueFactor?: number;
  greenFactor?: number;
  baseShift?: number;
}
class MapLibreVectorSourceSpec implements MapLibreBaseSourceSpec {
  type = "vector";
  encoding?: "mvt" | "mlt";
}
class MapLibreImageSourceSpec implements MapLibreBaseSourceSpec {
  type = "image";
  url: MaybePromise<string>;
  coordinates: MaybePromise<MapLibreCoordinates>;

  constructor(baseSpec: MapLibreBaseSourceSpec, url: MaybePromise<string>, coordinates: MaybePromise<Coordinates>) {
    this.url = url;
    this.coordinates = coordinates;
    Object.assign(this, baseSpec)
  }
}


type MapLibreSourceSpec =
  | MapLibreRasterSourceSpec
  | MapLibreRasterDemSourceSpec
  | MapLibreVectorSourceSpec
  | MapLibreImageSourceSpec;

/*
You have a ImageSource, right?
You want it to work with MapLibre, right?
Then you need to make an adapter.
An adapter for MapLibre means you give it an ImageSource, and it creates a ready-to-go source with all the MapLibre spec goodness.
For example, you pass a StaticImage, that means it will generate a url and specify type = "image" and make coordinates. That's it.
  Maybe we should automatically make those coordinates? Optional 'determine coordinates' arg that yoinks the dimensions and converts to coords?
For example, you pass a PMTilesImage, that means it generates url, tileSize, encoding, type, etc. based on what's inside that Header-Metadata.
  How will that work?
  this.spec will be a MaybePromise<Spec>. (That means in Svelte we can roll an each-await on the .spec, and once it then's, we dump all that spec goodness into the Component.)
  It'll be easy. In the constructor we'll define the .spec as an async function (or somehow async initialize it elsewhere).
    We first await the pmtiles.header and .metadata, because those are also MaybePromise's.
    Then yoink all the relevant header and metadata prop goodness. tileSize. encoding. etc.
    Then make a spec class accordingly — raster, raster-dem, vector — with those props.
    Set this.spec = spec, just like with pmtiles._initializeHeader().
    Then return spec. That return will be a Promise. But as soon it hits this.spec = spec, we'll have our Spec rather than a Promise.
*/

export class MapLibreSourceSpecAdapter {
  source: Source;
  spec: MapLibreSourceSpec;

  constructor(source: Source) {
    this.source = source;
    let spec;
    switch (source.format) {
      case "pmtiles":
        source = source as PMTilesTileset
        spec = {
          url: `pmtiles://${source.archive.source?.getKey()}`,
        }
        const metadata = source.archive
      default:
        spec = {}
    }
    this.spec = spec;
  }


}

// class TileJSONTileset implements Tileset, Remote {
//   url: string;

//   constructor(url: string) {
//     this.url = url;
//   }

//   async test() {
//     await fetch(this.url);
//   }

//   async getBounds() {
//     const resp = await fetch(this.url);
//     const j = await resp.json();
//     return j.bounds as [number, number, number, number];
//   }

//   async getMaxZoom() {
//     const resp = await fetch(this.url);
//     const j = await resp.json();
//     return j.maxzoom;
//   }

//   get maplibreSourceUrl() {
//     return this.url;
//   }

//   async isOverlay() {
//     return true;
//   }

//   async isVector() {
//     const resp = await fetch(this.url);
//     const j = await resp.json();
//     const template = j.tiles[0];
//     const pathname = new URL(template).pathname;
//     return (
//       pathname.endsWith(".pbf") ||
//       pathname.endsWith(".mvt") ||
//       pathname.endsWith(".mlt")
//     );
//   }

//   get stateUrl() {
//     return this.url;
//   }

//   async getZxy(z: number, x: number, y: number) {
//     const resp = await fetch(this.url);
//     const j = await resp.json();
//     const template = j.tiles[0];
//     const tileURL = template
//       .replace("{z}", z)
//       .replace("{x}", x)
//       .replace("{y}", y);
//     const tileResp = await fetch(tileURL);
//     return await tileResp.arrayBuffer();
//   }

//   async getMetadata() {
//     const resp = await fetch(this.url);
//     return await resp.json();
//   }

//   async getVectorLayers() {
//     const metadata = await this.getMetadata();
//     return metadata.vector_layers.map((l: VectorLayer) => l.id);
//   }

//   async getVectorEncoding() {
//     const resp = await fetch(this.url);
//     const j = await resp.json();
//     const template = j.tiles[0];
//     const pathname = new URL(template).pathname;
//     if (pathname.endsWith(".mlt")) return "mlt";
//     return "mvt";
//   }
// }

// // TODO: Implement RelativePMTilesTileset

// // from a input box or a URL param state.
// export const tilesetFromString = (url: string): Tileset => {
//   const parsed = new URL(url);
//   if (parsed.pathname.endsWith(".json")) {
//     return new TileJSONTileset(url);
//   }
//   // TODO: if relative or if remote
//   return new RemotePMTilesTileset(url);
// };

// export const pmtilesTilesetFromFile = (file: File): LocalPMTilesTileset => {
//   return new LocalPMTilesTileset(file);
// };
