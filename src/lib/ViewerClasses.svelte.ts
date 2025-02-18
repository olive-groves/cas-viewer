import { FileSource, PMTiles } from 'pmtiles';

export class SourceLayer {
    #files: FileList | [] = $state([]);
    pmtiles: PMTiles | undefined = $state();
    url: string | undefined = $derived(`pmtiles://${this.pmtiles?.source?.getKey()}`)

    constructor(files?: FileList) {
        if (files) {
            this.files = files;
        }
    }

    set files(files: FileList) {
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

    // constructor(raster, raster_dem, raster_overlay) {
    //     this.raster = raster;
    //     this.raster_dem = raster_dem;
    //     this.raster_overlay = raster_overlay;
    // }
}