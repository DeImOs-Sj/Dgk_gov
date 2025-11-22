import fromKapsule from "react-kapsule";
import { useState, useEffect } from "react";

const initForceGraph3D = async (wrapperElement) =>
  import("3d-force-graph").then((m) =>
    fromKapsule(m.default, {
      wrapperElementType: wrapperElement,
      methodNames: [
        // bind methods
        "emitParticle",
        "d3Force",
        "d3ReheatSimulation",
        "stopAnimation",
        "pauseAnimation",
        "resumeAnimation",
        "cameraPosition",
        "zoomToFit",
        "getGraphBbox",
        "screen2GraphCoords",
        "graph2ScreenCoords",
        "postProcessingComposer",
        "lights",
        "scene",
        "camera",
        "renderer",
        "controls",
        "refresh",
      ],
      initPropNames: ["controlType", "rendererConfig", "extraRenderers"],
    }),
  );

/**
 * Dynamic import of 3D Force Graph library.
 * Returned value will be null until the promise resolves.
 *
 * @param {React.Component | string | any} component Wrapper component for the graph
 * @param {THREE} threeJS Instance of THREE.js
 * @returns {React.FunctionComponent | null} ForceGraph3D react component
 */
const useForceGraph3D = (component, threeJS) => {
  const [ForceGraph3D, setForceGraph3D] = useState(null);

  useEffect(() => {
    globalThis.THREE = globalThis.THREE || threeJS;
    initForceGraph3D(component).then((forceGraph3D) => {
      setForceGraph3D(forceGraph3D);
    });
  }, [component]);

  return ForceGraph3D;
};

export default useForceGraph3D;
