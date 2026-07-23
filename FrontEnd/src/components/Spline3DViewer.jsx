import React, { useState } from "react";
import Spline from "@splinetool/react-spline";
import { Loader2, Maximize2, Sparkles, RefreshCw } from "lucide-react";

export default function Spline3DViewer({ sceneUrl = "https://prod.spline.design/PcMI71yI07N-AnFq/scene.splinecode" }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  function onLoad(splineApp) {
    setIsLoading(false);
  }

  function onError(err) {
    console.error("Spline load error:", err);
    setIsLoading(false);
    setHasError(true);
  }

  return (
    <div className="spline-3d-container glass-panel">
      {/* 3D Viewer Header */}
      <div className="spline-header">
        <div className="spline-title-group">
          <Sparkles size={16} className="text-orange" />
          <span className="spline-title font-mono">3D INTELLIGENCE CANVAS</span>
          <span className="spline-badge font-mono">SPLINE REALTIME 3D</span>
        </div>
        <button
          className="spline-action-btn"
          onClick={() => { setIsLoading(true); setHasError(false); }}
          title="Reload 3D Scene"
        >
          <RefreshCw size={14} className={isLoading ? "spin" : ""} />
        </button>
      </div>

      {/* 3D Scene Canvas Box */}
      <div className="spline-viewport">
        {isLoading && (
          <div className="spline-loader font-mono">
            <Loader2 size={24} className="spin text-orange" />
            <span>Loading Interactive Spline 3D Scene...</span>
          </div>
        )}

        {hasError ? (
          <div className="spline-error-box font-mono">
            <span>Unable to load WebGL Spline 3D scene directly. Please check internet connection.</span>
          </div>
        ) : (
          <Spline
            scene={sceneUrl}
            onLoad={onLoad}
            onError={onError}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
