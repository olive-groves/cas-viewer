<script lang="ts">
  import { fade } from 'svelte/transition';
  import hillshadeIconEnabled from '$lib/hillshade-enabled.svg'
  import hillshadeIconDisabled from '$lib/hillshade-disabled.svg'
  import rgbIconEnabled from '$lib/rgb-enabled.svg'
  import rgbIconDisabled from '$lib/rgb-disabled.svg'
  import {
    MapLibre,
    RasterTileSource,
    RasterLayer,
    RasterDEMTileSource,
    Terrain,
    HillshadeLayer,
    NavigationControl,
    FullScreenControl,
    CustomControl,
    AttributionControl,

    BackgroundLayer

  } from 'svelte-maplibre-gl';
  import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import { PMTiles } from 'pmtiles';
  import type { FlyToOptions, LayerSpecification } from 'maplibre-gl';

  let map: maplibregl.Map | undefined = $state()

  let destinations: FlyToOptions[] = [
    {
      zoom: 6.67,
      center: [
        -26.11,
        34.015
      ],
      bearing: 44,
      pitch: 74,
      essential: true,
      speed: 0.7,
      curve: 1.2
    },
    {
      zoom: 6.13,
      center: [
        117.398,
        44.091
      ],
      bearing: 0,
      pitch: 67,
      essential: true,
      speed: 0.7,
      curve: 1.2
    },
    {
      zoom: 6.77,
      center: [
        108.492,
        46.25
      ],
      bearing: -38,
      pitch: 74,
      essential: true,
      speed: 0.7,
      curve: 1.2
    },
    {
      zoom: 0,
      center: [
        0,
        0
      ],
      bearing: 0,
      pitch: 0,
      essential: true,
      speed: 1,
      curve: 1
    }
  ]

  let i_destination = $state(destinations.length - 2);

  function setNewDestination() {
    i_destination += 1;
    i_destination = i_destination % destinations.length
  }

  let destination = $derived(destinations[i_destination])

  function flyToRandom(whereTo: FlyToOptions) {
    if (map) {
      map.flyTo(whereTo);
    }
  }

  function ease2D() {
    if (map) {
      map.flyTo({
        pitch: 0,
        essential: true
      });
    }
  }

  function ease3D() {
    if (map) {
      let bearing = map.getBearing();
      bearing += 30;
      map.flyTo({
        pitch: 50,
        bearing: bearing,
        essential: true
      });
    }
  }

  let disclaimerVisible = $state(true)
  let colorVisible = $state(true)
  let terrainVisible = $state(true)
  let hillshadeVisible = $state(true)
  let creditsVisible = $state(false)

  let center = $state({ lng: 0.0, lat: 0.0 });

  let urls: string[] = [
    "https://pub-71d989b3685545118a21f845c49db6a3.r2.dev/paintings/almond-blossom/20241023_175809_stitched_rgb.pmtiles",
    "https://pub-71d989b3685545118a21f845c49db6a3.r2.dev/paintings/almond-blossom/20241023_175809_stitched_height.pmtiles"
  ]
  let pmtiles: PMTiles[] = [];
  let headers: {}[] = [];
  let metadatas: {}[] = [];
  const getHeaderMetadata = async () => {
    pmtiles = urls.map((url) => new PMTiles(url));
    headers = pmtiles.map((p) => p.getHeader())
    metadatas = pmtiles.map((p) => p.getMetadata())
    return {
      headers,
      metadatas
    }
  }
</script>

<!-- Add pmtiles:// Protocol globally -->
<PMTilesProtocol />

<!-- Use the pmtiles:// protocol -->
<div id=main style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; margin: none;">
{#await getHeaderMetadata()}
    <em>Loading</em>
{:then headers_metadatas}
  <MapLibre
    bind:map={map}
    onload={() => {
      setTimeout(() => disclaimerVisible = false, 5000);
      setNewDestination();
      flyToRandom(destination);
    }
    }
    inlineStyle="height: 100%; width: 100%;"
    renderWorldCopies={false}
    maxPitch={87}
    aroundCenter={false}
    hash={true}
    attributionControl={false}
    zoom={destinations[2].zoom}
    center={destinations[2].center}
    pitch={destinations[2].pitch}
    bearing={destinations[2].bearing}
  >
    <AttributionControl position="bottom-left" compact={true} customAttribution={"<a href='https://harmbelt.nl/'>Harm Belt · <em>Almond Blossom<em></a>"} />
    <CustomControl position="top-left">
      <div>
        <button
          onclick={() => creditsVisible = !creditsVisible}
          style="color: #333; width: fit-content; padding-left: 4px; padding-right: 4px;"
        >
        Credits
        </button>
      </div>
      {#if creditsVisible}
        <div style:color=black style:background-color=#333 style:padding=4px>
          <p style:margin=0px>
            <a href='https://maplibre.org/'>MapLibre</a>
            <a href='https://libvips.org/'>libvips</a>
            <a href='https://svelte-maplibre-gl.mierune.dev/'>Svelte MapLibre GL</a>
          </p>
          <p style:margin=0px>
            <a href='https://docs.protomaps.com/'>PMTiles</a>
            <a href='https://python.org/'>Python</a>
            <a href='https://opencv.org/'>OpenCV</a>
            <a href='https://developer.mozilla.org/'>MDN</a>
            <a href='https://svgrepo.com/'>SVG Repo</a>
          </p>
        </div>
      {/if}
    </CustomControl>
    <FullScreenControl position="bottom-right" container={document.getElementById("main")}/>
    <NavigationControl position="bottom-right" visualizePitch={true} showCompass={true} showZoom={false} />
    <CustomControl position="bottom-right" class="maplibregl-ctrl maplibregl-ctrl-group">
      <button
        title={terrainVisible ? "Disable 3D" : "Enable 3D"}
        onclick={() => {
          terrainVisible = !terrainVisible;
          if (terrainVisible) {setTimeout(() => ease3D(), 200)}
          else {setTimeout(() => ease2D(), 200)}
        }}
        style:color={terrainVisible ? "#33b5e5" : "#555"}
        style:font-weight=900>
        3D
      </button>
    </CustomControl>
    <CustomControl position="bottom-right" class="maplibregl-ctrl maplibregl-ctrl-group">
      <!-- <button
        title={colorVisible ? "Hide RGB" : "Show RGB"}
        onclick={() => colorVisible = !colorVisible}
        style:color={colorVisible ? "#1dade2" : "#555"}
        style:font-size=90%
        style:font-weight=900
      >
        RGB
      </button> -->
      <button
        title={colorVisible ? "Hide RGB" : "Show RGB"}
        onclick={() => colorVisible = !colorVisible}>
        <img alt="RGB icon" src={colorVisible ? rgbIconEnabled : rgbIconDisabled} style="position: relative; width: 80%; margin-bottom: -2px;"/>
      </button>
      <button
        title={hillshadeVisible ? "Hide shading" : "Show shading"}
        onclick={() => hillshadeVisible = !hillshadeVisible}>
        <img alt="Hillshade icon" src={hillshadeVisible ? hillshadeIconEnabled : hillshadeIconDisabled} style="position: relative; width: 80%; margin-bottom: -2px;"/>
      </button>
    </CustomControl>
    <CustomControl>
      <div>
        <button
          onclick={() => {
            setNewDestination()
            flyToRandom(destination)
          }}
          style="color: #333; padding-left: 4px; padding-right: 4px;"
        >
        Fly
        </button>
      </div>
  </CustomControl>
    <RasterDEMTileSource
      id="terrain"    
      url={`pmtiles://${urls[1]}`}
      encoding="custom"
      baseShift={0}
      redFactor={256*256}
      greenFactor={256}
      blueFactor={1}
      tileSize={256}
    >
      <BackgroundLayer
        paint={{
          'background-opacity': 1,
          'background-color': `hsl(0, 0%, ${50}%)`
        }}
      />
      {#if terrainVisible}
        <Terrain exaggeration={12} />
      {/if}
    </RasterDEMTileSource>
    <RasterTileSource
      url={`pmtiles://${urls[0]}`}
      tileSize={256}
    >
      <RasterLayer
        layout={{visibility: colorVisible ? "visible" : "none"}}
        paint={{
          'raster-resampling': 'nearest'
        }}
      />
    </RasterTileSource>
    <RasterDEMTileSource
      id="hillshade"
      url={`pmtiles://${urls[1]}`}
      encoding="custom"
      baseShift={0}
      redFactor={256*256}
      greenFactor={256}
      blueFactor={1}
      tileSize={256}
    >
      <HillshadeLayer
        layout={{visibility: hillshadeVisible ? "visible" : "none"}}
        paint={{
          'hillshade-exaggeration': 1.0,
          'hillshade-shadow-color': `rgba(0, 0, 0, 1.0)`,
          'hillshade-accent-color': "rgba(0, 0, 0, 0.5)",
          'hillshade-highlight-color': `rgba(255, 255, 255, 0.5)`,
          'hillshade-illumination-anchor': 'map',
          'hillshade-illumination-direction': 315
        }}
      />
    </RasterDEMTileSource>
  </MapLibre>
  {#if disclaimerVisible}
    <em style="position: absolute; pointer-events: none; font-size: 2em;" transition:fade>
      In development
    </em>
  {/if}
{/await}
</div>
