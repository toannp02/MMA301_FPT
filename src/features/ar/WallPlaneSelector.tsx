import React from "react";
import { ViroARPlane, ViroARPlaneSelector } from "@reactvision/react-viro";

// Viro 3.0.3 filters Vertical in JS but omits the native plane's alignment.
// Android defaults that plane to Horizontal and can detach it on anchor updates.
// Keep the pinned selector's tap conversion/reset behavior, while supplying
// the missing native prop. Regression tests exercise the real selector render.
export class WallPlaneSelector extends ViroARPlaneSelector {
  _renderPlanes(): React.JSX.Element[] {
    return super._renderPlanes().map((plane) =>
      React.cloneElement<React.ComponentProps<typeof ViroARPlane>>(plane, {
        alignment: "Vertical",
      }),
    );
  }
}
