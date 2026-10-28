import React from "react";
import type { GestureResponderEvent } from "react-native";
import { act, renderHook } from "@testing-library/react-native";
import { useDirectManipulation } from "../../src/ui/studio/useDirectManipulation";

type Handlers = ReturnType<typeof useDirectManipulation>;
type Name =
  | "onResponderGrant"
  | "onResponderMove"
  | "onResponderRelease"
  | "onResponderTerminate";

function setup(initial: string | null = null, disabled = false) {
  const scale = jest.fn(),
    move = jest.fn(),
    view = jest.fn(),
    start = jest.fn(),
    finish = jest.fn();
  const hook = renderHook(() => {
    const [selected, select] = React.useState(initial);
    const handlers = useDirectManipulation({
      disabled,
      selected,
      select,
      zoom: 2,
      pan: { x: 0, y: 0 },
      hit: (p) => ({
        id: p.x < 100 ? "art" : null,
        token: p.x < 100 ? "art:art" : null,
        scale: 1,
      }),
      scale,
      move,
      view,
      start,
      finish,
    });
    return { selected, handlers };
  });
  /** x is the first finger position; dx/dy shift every finger; spacing separates fingers. */
  function invoke(
    name: Name,
    x: number,
    touches: number,
    dx = 0,
    dy = 0,
    spacing = 50,
  ) {
    const event = {
      nativeEvent: {
        locationX: x,
        locationY: 50,
        touches: Array.from({ length: touches }, (_, i) => ({
          pageX: x + dx + i * spacing,
          pageY: 50 + dy,
        })),
      },
    } as unknown as GestureResponderEvent;
    act(() => {
      (
        hook.result.current.handlers[name] as (e: GestureResponderEvent) => void
      )(event);
    });
  }
  const tap = (x: number) => {
    invoke("onResponderGrant", x, 1);
    invoke("onResponderRelease", x, 0);
  };
  const selected = () => hook.result.current.selected;
  const handlers = (): Handlers => hook.result.current.handlers;
  return { selected, handlers, invoke, tap, scale, move, view, start, finish };
}
test("tap selects, a second tap deselects, and touching background deselects without modifying art", () => {
  const x = setup();
  x.tap(50);
  expect(x.selected()).toBe("art");
  x.tap(50);
  expect(x.selected()).toBeNull();
  x.tap(50);
  x.tap(200);
  expect(x.selected()).toBeNull();
  expect(x.scale).not.toHaveBeenCalled();
  expect(x.move).not.toHaveBeenCalled();
  expect(x.start).not.toHaveBeenCalled();
});
test("unselected art cannot be dragged; selected art drags without toggling off at release", () => {
  const x = setup();
  x.invoke("onResponderGrant", 50, 1);
  x.invoke("onResponderMove", 50, 1, 20);
  x.invoke("onResponderRelease", 50, 0, 20);
  expect(x.move).not.toHaveBeenCalled();
  expect(x.selected()).toBeNull();
  x.tap(50);
  x.invoke("onResponderGrant", 50, 1);
  x.invoke("onResponderMove", 50, 1, 20);
  x.invoke("onResponderRelease", 50, 0, 20);
  expect(x.start).toHaveBeenCalledWith("art:art");
  expect(x.move).toHaveBeenLastCalledWith(20, 0);
  expect(x.selected()).toBe("art");
});
test("a small jitter still counts as a tap, but dragging back to the start does not", () => {
  const x = setup("art");
  x.invoke("onResponderGrant", 50, 1);
  x.invoke("onResponderMove", 50, 1, 3);
  x.invoke("onResponderRelease", 50, 0, 3);
  expect(x.move).not.toHaveBeenCalled();
  expect(x.selected()).toBeNull();
  x.tap(50);
  x.invoke("onResponderGrant", 50, 1);
  x.invoke("onResponderMove", 50, 1, 30);
  x.invoke("onResponderMove", 50, 1, 0);
  x.invoke("onResponderRelease", 50, 0);
  expect(x.selected()).toBe("art");
});
test("pinching on art targets only art, including when the second finger is added later", () => {
  const x = setup();
  x.invoke("onResponderGrant", 50, 1);
  x.invoke("onResponderMove", 50, 2, 0, 0, 50);
  x.invoke("onResponderMove", 50, 2, 0, 0, 100);
  x.invoke("onResponderRelease", 50, 0);
  expect(x.scale).toHaveBeenLastCalledWith("art", 2);
  expect(x.view).not.toHaveBeenCalled();
  expect(x.selected()).toBe("art");
});
test("adding a finger mid-drag stops moving art and lifting one finger after a pinch neither drags nor toggles", () => {
  const x = setup("art");
  x.invoke("onResponderGrant", 50, 1);
  x.invoke("onResponderMove", 50, 1, 20);
  expect(x.move).toHaveBeenCalledTimes(1);
  x.invoke("onResponderMove", 50, 2, 20, 0, 40);
  expect(x.finish).toHaveBeenCalledTimes(1);
  x.invoke("onResponderMove", 50, 2, 20, 0, 80);
  x.invoke("onResponderMove", 50, 1, 60);
  x.invoke("onResponderMove", 50, 1, 90);
  x.invoke("onResponderRelease", 50, 0);
  expect(x.move).toHaveBeenCalledTimes(1);
  expect(x.scale).toHaveBeenLastCalledWith("art", 2);
  expect(x.selected()).toBe("art");
});
test("background pinch and pan change only room view even if art was selected", () => {
  const x = setup("art");
  x.invoke("onResponderGrant", 200, 2, 0, 0, 50);
  x.invoke("onResponderMove", 200, 2, 10, 20, 100);
  x.invoke("onResponderRelease", 200, 0);
  // Centroid moves by the offset plus half the extra finger spread (25px).
  expect(x.view).toHaveBeenLastCalledWith(4, { x: 35, y: 20 });
  expect(x.selected()).toBeNull();
  expect(x.scale).not.toHaveBeenCalled();
  expect(x.move).not.toHaveBeenCalled();
});
test("one-finger background drag pans a zoomed room and a cancelled touch never toggles selection", () => {
  const x = setup("art");
  x.invoke("onResponderGrant", 200, 1);
  x.invoke("onResponderMove", 200, 1, 15, 5);
  expect(x.view).toHaveBeenLastCalledWith(2, { x: 15, y: 5 });
  x.invoke("onResponderRelease", 200, 0);
  x.tap(50);
  expect(x.selected()).toBe("art");
  x.invoke("onResponderGrant", 50, 1);
  x.invoke("onResponderTerminate", 50, 0);
  expect(x.selected()).toBe("art");
});
test("disabled editing modes do not claim touches", () => {
  const x = setup(null, true);
  expect(x.handlers().onStartShouldSetResponder()).toBe(false);
  expect(x.handlers().onMoveShouldSetResponderCapture()).toBe(false);
});
