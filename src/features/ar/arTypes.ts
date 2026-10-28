import type { FrameStyle } from "../../domain/models";
export interface ARArtworkInput {
  sourceKind?: "catalog" | "custom";
  id: string;
  imageUri: string;
  widthCm: number;
  heightCm: number;
}
export type ARStatus =
  | "initializing"
  | "scanning"
  | "wall-found"
  | "placed"
  | "adjusting"
  | "capturing"
  | "captured"
  | "error";
export interface ARPlacementState {
  status: ARStatus;
  artwork: ARArtworkInput;
  scaleFactor: number;
  frameStyle: FrameStyle;
  wallSelected: boolean;
  errorMessage?: string;
}
export interface PlacementSnapshot {
  artworkId: string;
  scaleFactor: number;
  widthCm: number;
  heightCm: number;
  frameStyle: FrameStyle;
}
export interface ARViewerProps {
  artwork: ARArtworkInput;
  onBack: () => void;
  onCapture: (fileUri: string, placement: PlacementSnapshot) => void;
  onError: (message: string) => void;
}
