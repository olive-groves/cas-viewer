<!-- MiniMapViewer

It displays where all views are with rectangles on the zoomed-out layer(s).
- It therefore knows all views and their cameras.

If all the views are synced, it'll just show a single rectangle.
If a view is not synced, it will show that rectangle separately.

The zoomed-out layer(s) are selected by heuristics:
- The first raster, hillshade, or color-relief layer of the views.
- The first layer is found by traversing the order of layers in the order of views, including nested views (multiviews). If the first view is a multiview, it will traverse that multiview before proceeding to the second view.


The zoom is not set. Rather, a transformConstrain that keeps the map filled in view.
Zoom in/out if resize; keep the bounds within view.
 -->
