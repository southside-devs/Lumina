import L from "leaflet";

declare module "leaflet" {
  interface MapOptions {
    smoothWheelZoom?: boolean | "center";
    smoothSensitivity?: number;
  }
}

// Ensure the handler is only registered once in the browser environment
if (typeof window !== "undefined" && !(L.Map as any).prototype.smoothWheelZoom) {
  const SmoothWheelZoom = (L.Handler as any).extend({
    addHooks: function () {
      L.DomEvent.on(this._map.getContainer(), "wheel", this._onWheelScroll, this);
    },

    removeHooks: function () {
      L.DomEvent.off(this._map.getContainer(), "wheel", this._onWheelScroll, this);
      if (this._timeoutId) clearTimeout(this._timeoutId);
      if (this._zoomAnimationId) cancelAnimationFrame(this._zoomAnimationId);
    },

    _onWheelScroll: function (e: WheelEvent) {
      if (!this._isWheeling) {
        this._onWheelStart(e);
      }
      this._onWheeling(e);
    },

    _onWheelStart: function (e: WheelEvent) {
      const map = this._map;
      this._isWheeling = true;
      this._wheelMousePosition = map.mouseEventToContainerPoint(e);
      this._centerPoint = map.getSize().divideBy(2);
      this._startLatLng = map.containerPointToLatLng(this._centerPoint);
      this._wheelMouseLatLng = map.containerPointToLatLng(this._wheelMousePosition);
      this._startZoom = map.getZoom();
      this._moved = false;
      this._zooming = true;

      map.stop();
      if ((map as any)._panAnim) (map as any)._panAnim.stop();

      this._goalZoom = map.getZoom();
      this._prevCenter = map.getCenter();
      this._prevZoom = map.getZoom();

      this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
    },

    _onWheeling: function (e: WheelEvent) {
      const map = this._map;
      const delta = (L.DomEvent as any).getWheelDelta(e);
      const sensitivity = map.options.smoothSensitivity || 1;

      this._goalZoom = this._goalZoom + delta * 0.003 * sensitivity;
      if (this._goalZoom < map.getMinZoom() || this._goalZoom > map.getMaxZoom()) {
        this._goalZoom = map._limitZoom(this._goalZoom);
      }
      this._wheelMousePosition = map.mouseEventToContainerPoint(e);
      this._wheelMouseLatLng = map.containerPointToLatLng(this._wheelMousePosition);

      if (this._timeoutId) clearTimeout(this._timeoutId);
      this._timeoutId = setTimeout(this._onWheelEnd.bind(this), 200);

      L.DomEvent.preventDefault(e);
      L.DomEvent.stopPropagation(e);
    },

    _onWheelEnd: function () {
      this._isWheeling = false;
      if (this._zoomAnimationId) cancelAnimationFrame(this._zoomAnimationId);
      (this._map as any)._moveEnd(true);
    },

    _updateWheelZoom: function () {
      const map = this._map;

      if (!map.getCenter().equals(this._prevCenter) || map.getZoom() !== this._prevZoom) {
        return;
      }

      if (Math.abs(this._goalZoom - map.getZoom()) < 0.001) {
        this._zoom = this._goalZoom;
      } else {
        this._zoom = map.getZoom() + (this._goalZoom - map.getZoom()) * 0.3;
      }
      this._zoom = Math.round(this._zoom * 1000) / 1000;

      const delta = this._wheelMousePosition.subtract(this._centerPoint);

      let newCenter: L.LatLng;
      if (map.options.smoothWheelZoom === "center" || (delta.x === 0 && delta.y === 0)) {
        newCenter = this._startLatLng;
      } else {
        newCenter = map.unproject(map.project(this._wheelMouseLatLng, this._zoom).subtract(delta), this._zoom);
      }

      if (Math.abs(this._goalZoom - map.getZoom()) < 0.0001 && newCenter.equals(map.getCenter())) {
        if (this._isWheeling) {
          this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
        }
        return;
      }

      if (!this._moved) {
        (map as any)._moveStart(true, false);
        this._moved = true;
      }

      (map as any)._move(newCenter, this._zoom);
      this._prevCenter = map.getCenter();
      this._prevZoom = map.getZoom();

      this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
    },
  });

  (L.Map as any).addInitHook("addHandler", "smoothWheelZoom", SmoothWheelZoom);
}

export {};
