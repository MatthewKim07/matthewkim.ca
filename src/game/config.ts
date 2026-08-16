// Master switch for matthew.exe.
//
// While the game is paused mid-build, this stays false: the footer launcher
// does not render and the overlay never mounts, so the engine, scenes, and
// GLB models stay out of the client bundle entirely. All game code and
// history are kept intact — flip this to true to bring it back.
export const GAME_ENABLED = false;
