import React, { memo, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Image as ReadyImage } from "expo-image";
import Svg, {
  Defs,
  Image as SvgImage,
  G,
  Use,
  ClipPath,
  Polygon,
  Filter,
  FeColorMatrix,
  Mask,
  Rect,
  Polyline,
} from "react-native-svg";
import type { WallSpace } from "../../domain/spaces";
import {
  appearanceMatrix,
  pointString,
  sceneGraphic,
  shadowLayers,
  depthFaces,
  edgeStrips,
} from "../../features/studio/rendering";
export const SpaceCanvas = memo(function SpaceCanvas({
  space,
  width,
  height,
  onReady,
  onError,
  exportQuality = false,
}: {
  space: WallSpace;
  width: number;
  height: number;
  onReady?: (ready: boolean) => void;
  onError?: (message: string) => void;
  exportQuality?: boolean;
}) {
  const graphic = useMemo(
    () => sceneGraphic(space, width, height, exportQuality ? 8 : 4),
    [space, width, height, exportQuality],
  );
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const loadedImage = (uri: string) =>
    setLoaded((current) =>
      current.has(uri) ? current : new Set([...current, uri]),
    );
  const required = [
    space.room.uri,
    ...graphic.images.map((image) => image.uri),
    ...(space.wall.occlusionEnabled !== false && space.wall.occlusionMaskUri
      ? [space.wall.occlusionMaskUri]
      : []),
  ];
  const ready = required.every((uri) => loaded.has(uri));
  useEffect(() => {
    onReady?.(ready);
  }, [ready, onReady]);
  return (
    <View style={{ width, height }}>
      {Array.from(new Set(required)).map((uri) => (
        <ReadyImage
          key={uri}
          source={{ uri }}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          onLoad={() => loadedImage(uri)}
          onError={() =>
            onError?.(
              "A room or artwork image could not load. Reload the images or choose another photo.",
            )
          }
        />
      ))}
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {graphic.images.map((image) => (
            <SvgImage
              key={image.id}
              id={image.id}
              href={{ uri: image.uri }}
              width={image.width}
              height={image.height}
              preserveAspectRatio="none"
              onLoad={() => loadedImage(image.uri)}
            />
          ))}
        </Defs>
        <SvgImage
          href={{ uri: space.room.uri }}
          width={width}
          height={height}
          preserveAspectRatio="none"
          onLoad={() => loadedImage(space.room.uri)}
        />
        {graphic.pieces.map((piece) => {
          const a = piece.appearance;
          return (
            <G key={piece.id}>
              {shadowLayers(piece, width, height).map((layer, i) => (
                <Polygon
                  key={i}
                  points={pointString(layer.quad)}
                  fill="black"
                  opacity={layer.opacity}
                />
              ))}
              {depthFaces(piece, width, height).map((face, i) => (
                <Polygon
                  key={`depth${i}`}
                  points={pointString(face.quad)}
                  fill={face.fill}
                />
              ))}
              <Polygon
                points={pointString(piece.outer)}
                fill={
                  a.frame === "wood"
                    ? "#9b744c"
                    : a.frame === "white"
                      ? "#ece8df"
                      : "#181818"
                }
              />
              <Polygon
                points={pointString(piece.mount)}
                fill={a.frameProfile === "float" ? "#171717" : "#eeeae0"}
              />
              <Defs>
                {piece.triangles.map((t) => (
                  <ClipPath key={t.id} id={t.id}>
                    <Polygon points={t.points} />
                  </ClipPath>
                ))}
                <ClipPath id={`${piece.filterId}_bounds`}>
                  <Polygon points={pointString(piece.quad)} />
                </ClipPath>
                <Filter id={piece.filterId}>
                  <FeColorMatrix type="matrix" values={appearanceMatrix(a)} />
                </Filter>
              </Defs>
              <G clipPath={`url(#${piece.filterId}_bounds)`}>
                <G filter={`url(#${piece.filterId})`}>
                  {piece.triangles.map((t) => (
                    <G key={t.id} transform={`matrix(${t.matrix.join(" ")})`}>
                      <Use href={`#${t.source}`} clipPath={`url(#${t.id})`} />
                    </G>
                  ))}
                </G>
              </G>
              {edgeStrips(piece, width, height).map((strip, i) => (
                <Polygon
                  key={`edge${i}`}
                  points={pointString(strip.quad)}
                  fill={strip.fill}
                  opacity={strip.opacity}
                />
              ))}
              {a.glazing && (
                <Polygon
                  points={pointString(piece.quad)}
                  fill="white"
                  opacity={0.07}
                />
              )}
            </G>
          );
        })}
        {space.wall.occlusionEnabled !== false &&
          !!space.wall.foregroundStrokes?.length && (
            <>
              <Defs>
                <Mask
                  id="painted-foreground"
                  maskUnits="userSpaceOnUse"
                  x={0}
                  y={0}
                  width={width}
                  height={height}
                  maskType="luminance"
                >
                  <Rect width={width} height={height} fill="black" />
                  {space.wall.foregroundStrokes.map((stroke, index) => (
                    <Polyline
                      key={index}
                      points={pointString(
                        stroke.points.map((p) => ({
                          x: p.x * width,
                          y: p.y * height,
                        })),
                      )}
                      fill="none"
                      stroke="white"
                      strokeWidth={stroke.radius * Math.min(width, height) * 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </Mask>
              </Defs>
              <SvgImage
                href={{ uri: space.room.uri }}
                width={width}
                height={height}
                preserveAspectRatio="none"
                mask="url(#painted-foreground)"
              />
            </>
          )}
        {space.wall.occlusionEnabled !== false &&
          space.wall.occlusionMaskUri && (
            <>
              <Defs>
                <Mask id="occlusion">
                  <SvgImage
                    href={{ uri: space.wall.occlusionMaskUri }}
                    width={width}
                    height={height}
                    preserveAspectRatio="none"
                    onLoad={() => loadedImage(space.wall.occlusionMaskUri!)}
                  />
                </Mask>
              </Defs>
              <SvgImage
                href={{ uri: space.room.uri }}
                width={width}
                height={height}
                preserveAspectRatio="none"
                mask="url(#occlusion)"
              />
            </>
          )}
      </Svg>
    </View>
  );
});
