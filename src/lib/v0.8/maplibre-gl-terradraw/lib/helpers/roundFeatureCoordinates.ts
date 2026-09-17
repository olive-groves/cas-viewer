// roundFeatureCoordinates adapted from https://github.com/watergis/maplibre-gl-terradraw/blob/main/src/lib/helpers/roundFeatureCoordinates.ts
// TODO: Proper citation

import type { GeoJSONStoreFeatures } from 'terra-draw';
import type { Point, LineString, MultiPoint, Polygon, MultiLineString, MultiPolygon, Position } from 'geojson';

export const roundGeometryCoordinates = <G extends Point | LineString | MultiPoint | Polygon| MultiLineString | MultiPolygon>(
	geometry: G,
	decimalPlaces: number = 9
): G => {
  function roundCoord(coord: Position) {
		return [Number(coord[0].toFixed(decimalPlaces)), Number(coord[1].toFixed(decimalPlaces))];
  }

  function nestedArrayDepth(array: any[], initialDepth = 0): number {
    let currentDepth = initialDepth;
    if (Array.isArray(array.at(0))) {
      currentDepth += 1;
      return nestedArrayDepth(array.at(0), currentDepth);
    }
    return currentDepth
  }

  let coordinates = geometry.coordinates;
  switch (nestedArrayDepth(coordinates)) {
    // Apparent 'Point'
    case 0:
      coordinates = roundCoord(coordinates as [number, number]);
      break;
    // Apparent 'LineString' or 'MultiPoint':
    case 1:
      coordinates = (coordinates as Position[]).map(roundCoord);
      break;
    // Apparent 'Polygon' or 'MultiLineString':
    case 2:
      coordinates = (coordinates as Position[][]).map((ring: Position[]) => ring.map(roundCoord));
      break;
    // Apparent 'MultiPolygon':
    case 3:
      coordinates = (coordinates as unknown as Position[][][]).map((polygon: Position[][]) =>
        polygon.map((ring: Position[]) => ring.map(roundCoord))
      );
      break;
    default:
      console.warn(`Unsupported geometry type ${geometry.type}.`)
      break;
  }

  return {
    ...geometry,
    coordinates,
  };
};

/**
 * Round the coordinates of features to given coordinate precision
 *
 * If you want to add geojson with excessive coordinate precision to TerraDraw by using addFeatures,
 * TerraDraw raise a validation error if you add GeoJSON with excessive precision.
 *
 * use this function to make sure geojson coordinates to meet terradraw setting before adding features.
 *
 * The below is a sample usage of the function
 *
 * ```js
 * const drawControl = new MaplibreTerraDrawControl({
 *   adapterOptions: {
 *     coordinatePrecision: 6
 *   }
 * })
 * map.addControl(drawControl)
 *
 * map.once('load', ()=>{
 *   const features = [] // add your geojson features here
 *   const draw = drawControl.getTerradrawInstance()
 *   draw.addFeatures(roundFeaturesCoordinates(features), 6)
 * })
 * ```
 * @param features GeoJSON feature
 * @param decimalPlaces decimal places to 9 (default of terradraw)
 * @returns GeoJSON feature after rounding coordinates
 */
export const roundFeaturesCoordinates = (
	features: GeoJSONStoreFeatures[],
	decimalPlaces: number = 9,
): GeoJSONStoreFeatures[] => {
	// Process each feature
	return features.map((feature) => ({
		...feature,
    geometry: roundGeometryCoordinates(feature.geometry, decimalPlaces),
	}));
};
