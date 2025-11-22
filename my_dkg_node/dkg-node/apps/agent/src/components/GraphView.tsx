"use dom";
import { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import { THREE } from "expo-three";
// @ts-ignore No types for forcegraph
import useForceGraph3D from "@dkg/expo-forcegraph";

import {
  getNodeMesh,
  getLinkMesh,
  KnowledgeGraph,
  GRAPH_OPTIONS,
  CAMERA,
} from "@/shared/graph";

const lights: any[] = [];
const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
lights.push(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(100, 100, 100);
lights.push(directionalLight);

export default function GraphView(props: {
  ual: string;
  assertion: Record<string, any>[];
}) {
  const ForceGraph3D = useForceGraph3D(View, THREE);

  const [size, setSize] = useState<{ width: number; height: number }>();
  const graphRef = useRef(null);

  useEffect(() => {
    if (!size) return;

    const t = setTimeout(() => {
      (graphRef.current as any)?.cameraPosition(
        CAMERA.position,
        CAMERA.target,
        CAMERA.duration,
      );
      (graphRef.current as any)?.lights(lights);
    }, 300);

    return () => clearTimeout(t);
  }, [size]);

  const kg = new KnowledgeGraph(
    props.ual,
    { assertion: props.assertion },
    "v8",
  );

  return (
    <View
      style={{ flex: 1, width: "100%", height: "100%" }}
      onLayout={(l) => setSize(l.nativeEvent.layout)}
    >
      {size && ForceGraph3D && (
        <ForceGraph3D
          ref={graphRef}
          controlType="orbit"
          width={size.width}
          height={Math.max(size.height, 350)}
          backgroundColor={GRAPH_OPTIONS.backgroundColor}
          nodeThreeObject={(node: any) => {
            return getNodeMesh(node, "v8");
          }}
          inkWidth={0.4}
          linkColor="#ffffff"
          linkOpacity={1}
          linkThreeObjectExtend={true}
          linkThreeObject={(link: any) => {
            return getLinkMesh(link);
          }}
          linkPositionUpdate={(
            sprite: { position: { x: number; y: number; z: number } },
            {
              start,
              end,
            }: {
              start: { x: number; y: number; z: number };
              end: { x: number; y: number; z: number };
            },
          ) => {
            // Position sprite
            Object.assign(sprite.position, {
              x: start.x + (end.x - start.x) / 2,
              y: start.y + (end.y - start.y) / 2,
              z: start.z + (end.z - start.z) / 2,
            });
          }}
          graphData={kg.data}
        />
      )}
    </View>
  );
}
