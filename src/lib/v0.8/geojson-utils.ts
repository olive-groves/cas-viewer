import { LngLatBounds, type LngLatLike } from "maplibre-gl";
import type { Geometry, Point, LineString, Polygon, Position } from 'geojson';


export const terraDrawMaxBounds: LngLatBounds = new LngLatBounds([
  [-180, -85.049],
  [+180, +85.051129],
])

export function isGeometryOutOfBounds(geometry: Geometry, bounds: LngLatBounds): boolean {
  let coordinates: Position[];

  switch (geometry.type) {
    case 'Point':
      coordinates = [geometry.coordinates];
      break;
    case 'LineString':
    case 'MultiPoint':
      coordinates = geometry.coordinates;
      break;
    case 'Polygon':
    case 'MultiLineString':
      coordinates = geometry.coordinates[0];
      break;
    case 'MultiPolygon':
      coordinates = geometry.coordinates.flat(2);
      break;
    default:
      throw new Error(`Geometry type "${geometry?.['type']}" not supported.`)
  }

  for (const coordinate of coordinates) {
    if (!bounds.contains(coordinate as LngLatLike)) {
      return true
    }
  }
  return false
}

export function wrapGeometryCoordinatesToBounds<G extends Point | LineString | Polygon>(geometry: G, bounds: LngLatBounds): G["coordinates"] {
  let coordinates: Position[];

  switch (geometry.type) {
    case 'Point':
      coordinates = [geometry.coordinates];
      break;
    case 'LineString':
    // case 'MultiPoint':
      coordinates = geometry.coordinates;
      break;
    case 'Polygon':
    // case 'MultiLineString':
      coordinates = geometry.coordinates[0];
      break;
    // case 'MultiPolygon':
    //   coordinates = geometry.coordinates.flat(2);
    //   break;
    default:
      throw new Error(`Geometry type "${geometry?.['type']}" not supported.`)
  }

  coordinates.forEach((coordinate, i) => {
    coordinates[i][0] = wrap(coordinate[0], bounds.getWest(), bounds.getEast());
    coordinates[i][1] = Math.max(bounds.getSouth(), Math.min(coordinate[1], bounds.getNorth()));
  });
  switch (geometry.type) {
    case 'Point':
      return coordinates[0];
    case 'LineString':
    // case 'MultiPoint':
      return [coordinates];
    case 'Polygon':
    // case 'MultiLineString':
      return [coordinates];
    // case 'MultiPolygon':
    //   coordinates = geometry.coordinates.flat(2);
    //   break;
    default:
      throw new Error(`Geometry type "${geometry?.['type']}" not supported.`)
  }

  function wrap(n: number, min: number, max: number): number {
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return (w === min) ? max : w;
  }
}
