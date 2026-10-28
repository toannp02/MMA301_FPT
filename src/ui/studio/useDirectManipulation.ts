import { useEffect, useRef } from "react";
import type { GestureResponderEvent, NativeTouchEvent } from "react-native";
import type { Point } from "../../domain/spaces";
import { toggledSelection } from "../../features/studio/directManipulation";

interface Options {
  disabled: boolean;
  selected: string | null;
  zoom: number;
  pan: Point;
  hit: (point: Point) => {
    id: string | null;
    token: string | null;
    scale: number;
  };
  select: (id: string | null) => void;
  start: (token: string) => void;
  move: (dx: number, dy: number) => void;
  finish: () => void;
  scale: (id: string, scale: number) => void;
  scaleOf: (id: string) => number;
  view: (zoom: number, pan: Point) => void;
}
interface Gesture {
  id: string | null;
  selected: string | null;
  draggable: boolean;
  token: string | null;
  pinched: boolean;
  moved: boolean;
  /** Finger centroid that dx/dy are measured from; re-based when finger count changes. */
  origin: Point;
  touches: number;
  /** Translation accumulated before the current finger-count segment. */
  offset: Point;
  distance: number;
  zoom: number;
  pan: Point;
  scale: number;
}
const TAP_SLOP = 4;
const centroid = (touches: readonly NativeTouchEvent[]) => ({
  x: touches.reduce((sum, t) => sum + t.pageX, 0) / Math.max(1, touches.length),
  y: touches.reduce((sum, t) => sum + t.pageY, 0) / Math.max(1, touches.length),
});
const spread = (touches: readonly NativeTouchEvent[]) =>
  touches.length >= 2
    ? Math.hypot(
        touches[1].pageX - touches[0].pageX,
        touches[1].pageY - touches[0].pageY,
      )
    : 0;
/**
 * Direct manipulation on the room stage: tap art to select, tap it again or the
 * background to deselect, drag selected art, pinch art to resize, pinch/pan the
 * background to zoom the room view. Returned responder props read the latest
 * options only inside touch events, so one stable gesture spans re-renders.
 */
export function useDirectManipulation(o: Options) {
  const optionsRef = useRef(o);
  const gestureRef = useRef<Gesture | null>(null);
  useEffect(() => {
    optionsRef.current = o;
  }, [o]);
  const enabled = () => !optionsRef.current.disabled;
  const translation = (
    gesture: Gesture,
    touches: readonly NativeTouchEvent[],
  ) => {
    const c = centroid(touches);
    return {
      x: gesture.offset.x + c.x - gesture.origin.x,
      y: gesture.offset.y + c.y - gesture.origin.y,
    };
  };
  const end = (cancelled: boolean) => {
    const gesture = gestureRef.current,
      options = optionsRef.current;
    gestureRef.current = null;
    if (
      gesture &&
      !options.disabled &&
      !cancelled &&
      !gesture.pinched &&
      !gesture.moved
    )
      options.select(toggledSelection(gesture.selected, gesture.id));
    options.finish();
  };
  return {
    onStartShouldSetResponder: enabled,
    onMoveShouldSetResponder: enabled,
    onStartShouldSetResponderCapture: enabled,
    onMoveShouldSetResponderCapture: enabled,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event: GestureResponderEvent) => {
      const options = optionsRef.current,
        touches = event.nativeEvent.touches;
      if (options.disabled || !touches.length) return;
      const target = options.hit({
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      });
      const distance = spread(touches);
      const draggable = target.id !== null && target.id === options.selected;
      gestureRef.current = {
        id: target.id,
        selected: options.selected,
        draggable,
        token: target.token,
        pinched: distance > 0,
        moved: false,
        origin: centroid(touches),
        touches: touches.length,
        offset: { x: 0, y: 0 },
        distance,
        zoom: options.zoom,
        pan: options.pan,
        scale: target.scale,
      };
      if (!target.id) options.select(null);
    },
    onResponderMove: (event: GestureResponderEvent) => {
      const gesture = gestureRef.current,
        options = optionsRef.current;
      if (!gesture || options.disabled) return;
      const touches = event.nativeEvent.touches;
      if (touches.length !== gesture.touches) {
        // Re-base every new pinch segment on the current rendered scale/view.
        // Reusing the first spread after lifting/replacing a finger jumps size.
        const added = touches.length >= 2;
        gestureRef.current = {
          ...gesture,
          offset: { x: 0, y: 0 },
          origin: centroid(touches),
          touches: touches.length,
          ...(added
            ? {
                pinched: true,
                distance: spread(touches),
                zoom: options.zoom,
                pan: options.pan,
                scale: gesture.id ? options.scaleOf(gesture.id) : gesture.scale,
              }
            : {}),
        };
        if (added) options.finish();
        return;
      }
      const d = translation(gesture, touches);
      if (touches.length >= 2 && gesture.distance > 0) {
        const ratio = spread(touches) / gesture.distance;
        if (gesture.id) {
          options.select(gesture.id);
          options.scale(gesture.id, gesture.scale * ratio);
        } else
          options.view(Math.max(1, Math.min(4, gesture.zoom * ratio)), {
            x: gesture.pan.x + d.x,
            y: gesture.pan.y + d.y,
          });
        return;
      }
      if (gesture.pinched) return;
      if (!gesture.moved && Math.hypot(d.x, d.y) <= TAP_SLOP) return;
      if (!gesture.moved) {
        gestureRef.current = { ...gesture, moved: true };
        // Begin the drag only once it is clearly not a tap.
        if (gesture.draggable && gesture.token) options.start(gesture.token);
      }
      if (gesture.draggable) options.move(d.x, d.y);
      else if (!gesture.id && gesture.zoom > 1)
        options.view(gesture.zoom, {
          x: gesture.pan.x + d.x,
          y: gesture.pan.y + d.y,
        });
    },
    onResponderRelease: () => end(false),
    onResponderTerminate: () => end(true),
  };
}
