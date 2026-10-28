import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import type { Point, ForegroundStroke } from "../../domain/spaces";
import { pointString } from "../../features/studio/rendering";
export function ForegroundPainter({
  width,
  height,
  left,
  top,
  radius,
  onStroke,
}: {
  width: number;
  height: number;
  left: number;
  top: number;
  radius: number;
  onStroke: (stroke: ForegroundStroke) => void;
}) {
  const [drawing, setDrawing] = useState<{ points: Point[]; done: boolean }>({
    points: [],
    done: false,
  });
  const delivered = useRef<typeof drawing | null>(null);
  useEffect(() => {
    if (
      drawing.done &&
      drawing.points.length &&
      delivered.current !== drawing
    ) {
      delivered.current = drawing;
      onStroke({ radius, points: drawing.points });
    }
  }, [drawing, onStroke, radius]);
  const pan = useMemo(() => {
    const point = (x: number, y: number) => ({
      x: Math.max(0, Math.min(1, x / width)),
      y: Math.max(0, Math.min(1, y / height)),
    });
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const p = point(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
        );
        setDrawing({
          points: [p, { ...p, x: Math.min(1, p.x + 0.00001) }],
          done: false,
        });
      },
      onPanResponderMove: (event) => {
        const p = point(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
        );
        setDrawing((current) =>
          current.points.length >= 1000
            ? current
            : { points: [...current.points, p], done: false },
        );
      },
      onPanResponderRelease: () =>
        setDrawing((current) => ({ ...current, done: true })),
      onPanResponderTerminate: () => setDrawing({ points: [], done: false }),
    });
  }, [width, height]);
  return (
    <View
      accessibilityLabel="Paint foreground objects to keep them in front of the artwork"
      style={{ position: "absolute", left, top, width, height }}
      {...pan.panHandlers}
    >
      <Svg pointerEvents="none" width={width} height={height}>
        <Polyline
          points={pointString(
            (drawing.done ? [] : drawing.points).map((p) => ({
              x: p.x * width,
              y: p.y * height,
            })),
          )}
          fill="none"
          stroke="#D7BC83"
          strokeOpacity={0.65}
          strokeWidth={radius * Math.min(width, height) * 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
