// Window states for the title, the close/minimize buttons, drag buttons
export type WindowState = {
  state: "normal" | "maximized" | "minimized";
  frame: boolean,  // Visual bordered area around the document
  titlebar: boolean,
  title: string,
  controls: boolean,  // Maximize, minimize, roll up, drag, and other window controls
  clientArea: boolean,  // The content itself
}
