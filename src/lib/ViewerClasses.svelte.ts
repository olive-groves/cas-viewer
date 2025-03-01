import { FileSource, PMTiles } from 'pmtiles';

export class SourceLayer {
    #files = $state();
    pmtiles: PMTiles | undefined = $state();
    url: string | undefined = $derived(this.pmtiles?.source ? `pmtiles://${this.pmtiles.source?.getKey()}` : undefined)

    constructor(files?) {
        if (files) {
            this.files = files;
        }
    }

    set files(files) {
        this.#files = files
        if (files.length) {
            this.pmtiles = new PMTiles(new FileSource(files[0]))
        }
    }

    get files() {
        return this.#files
    }

    get header() {
        return this?.pmtiles?.getHeader()
    }

    get metadata() {
        return this?.pmtiles?.getMetadata()
    }
}

export class ViewerData {
    raster: SourceLayer = $state(new SourceLayer());
    raster_dem: SourceLayer = $state(new SourceLayer());
    raster_overlay: SourceLayer = $state(new SourceLayer());
    loaded = $state(false);

    // constructor(raster, raster_dem, raster_overlay) {
    //     this.raster = raster;
    //     this.raster_dem = raster_dem;
    //     this.raster_overlay = raster_overlay;
    // }
}