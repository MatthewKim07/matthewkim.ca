// Shared types for the hidden game ("Overworld"). See GAME_DESIGN.md.
//
// Phase 1 only uses "idle" and "playing" (plain open/close). "opening" and
// "closing" are reserved for the pixel construction / exit transition added in
// a later phase, so the state machine can grow without changing this contract.
export type GameState = "idle" | "opening" | "playing" | "closing";

export interface GameContextValue {
  state: GameState;
  /** Convenience: true whenever the overlay should be mounted/visible. */
  isOpen: boolean;
  /** Enter the game (idle -> playing for now). No-op if already open. */
  open: () => void;
  /** Return to the portfolio (-> idle). */
  close: () => void;
}
