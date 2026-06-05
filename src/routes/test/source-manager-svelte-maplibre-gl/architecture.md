# Architecture

## Users

I want a dashboard of ordered layers with various settings.
These layers are ordered. If I have a layer, I know which layers are before and after it.
Each layer has a source.
Svelte MapLibre GL paradigm is to specify a source, then nest the layer(s) to create from that source.
A naive approach would be to array those layers and {each} to create them, specifying source>layer.
However, I shouldn't {each} over the layers, because the same source could be created twice.
Thus, my approach should {each} over the sources, inserting the layer(s) as needed, and keeping the order.

If I remove a source, my dashboard of layers shouldn't suddenly lose sight of the layers associated with that layer.
  I need to maintain knowledge of the layers despite the missing sources.
  'LayerUI' that, if its source is undefined, shows that its missing. Not just vanish.
  Out of scope for now?

I want a project JSON that remembers the layers, sources, and settings.
  If I drag that JSON in, it should say:
    "Hey, you're missing these relative file and FileAPI sources. Add to project and drag-and-drop them."

Adding a source should automatically add a layer, because a source usually tells us its type.

### Source manager

I want to manage my sources:
- Some are remote.
- Some are relative.
- Some are File API.

### Layer manager

I want to manage my layers:
- Some layers point to a source.
- Some layers *don't* point to a source, like background layer for hillshade.
- They are in the order I want.


## Developers

### Source manager

#### Sources
Iterable of sources:
- Unique ID as key
- Optional? user-facing name, perhaps the pathname or 'name'/'title' from the source JSON

#### Add source

Register/return with unique ID.

Remote URL:
- Add via text?

Relative URL:
- Hardcoded private list that can be "added" by clicking from that list

File API:
- Drag and drop zone
- On add, registers a new file as a source, thereby adding to the sources
- Detecting duplicate sources is not in scope

#### Remove source

I can remove a source and not screw things up.

### Source
Like 'Tileset' from PMTiles
Abstract source that can be passed to the manager regardless of type (remote, fileAPI, etc.)
Methods for MapLibre, like URL
Type/purpose-specific children
- RemoteSource
- FileSource
  - FileAPI object
- RelativeSource
Not sure if children need to be defined built by file type? (PMTilesSource vs. ZYXSource vs. JSONSource)

### Layer manager

MapLibre-knowing? Or 'conveniently' have the same terms as MapLibre, but no MapLibre components
Svelte-agnostic? Reactive 'n-layers' not possible then

#### Layers
Iterable of layers:
- Unique ID as key
- Optional? user-facing name

#### Add layer
Return ID
Raster, raster-dem, background
Specifying source

#### Remove layer
Remove using ID

#### Number of layers
Derived? n of layers as convenience for slot-layers.
Or we make a slot layer manager?
