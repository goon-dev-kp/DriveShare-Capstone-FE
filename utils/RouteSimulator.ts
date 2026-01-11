import along from "@turf/along";
import findDistance from "@turf/distance";
import { point } from "@turf/helpers";
import { Animated } from "react-native";

type RouteSimulatorFeature = GeoJSON.Feature<
  GeoJSON.Point,
  { distance: number; nearestIndex: number }
>;

class Polyline {
  private readonly coordinates: GeoJSON.Position[];
  private readonly lineStringFeature: GeoJSON.Feature<GeoJSON.LineString>;
  public readonly totalDistance: number;

  constructor(lineStringFeature: GeoJSON.Feature<GeoJSON.LineString>) {
    this.coordinates = lineStringFeature.geometry.coordinates;
    this.lineStringFeature = lineStringFeature;

    this.totalDistance = 0;
    for (let i = 1; i < this.coordinates.length; i++) {
      this.totalDistance += findDistance(this.get(i - 1), this.get(i));
    }
  }

  coordinateFromStart(distance: number): RouteSimulatorFeature {
    const pointAlong = along(this.lineStringFeature, distance);

    return {
      ...pointAlong,
      properties: {
        ...pointAlong.properties,
        distance,
        nearestIndex: this.findNearestFloorIndex(distance),
      },
    };
  }

  findNearestFloorIndex(currentDistance: number) {
    let runningDistance = 0;

    for (let i = 1; i < this.coordinates.length; i++) {
      runningDistance += findDistance(this.get(i - 1), this.get(i));

      if (runningDistance >= currentDistance) {
        return i - 1;
      }
    }

    return -1;
  }

  get(index: number) {
    const coordinates = this.coordinates[index];

    if (!coordinates) {
      throw new Error("RouteSimulator coordinates not found");
    }

    return point(coordinates);
  }
}

export class RouteSimulator {
  private readonly polyline: Polyline;
  private previousDistance: number;
  private currentDistance: number;
  private baseSpeed: number;
  private speedMultiplier: number;
  private isRunning: boolean;

  private animatedValue: Animated.Value | undefined;
  private anim: Animated.CompositeAnimation | undefined;
  private listener:
    | ((
        point: GeoJSON.Feature<
          GeoJSON.Point,
          { distance: number; nearestIndex: number }
        >,
      ) => void)
    | undefined;

  constructor(lineString: GeoJSON.Feature<GeoJSON.LineString>, speed = 0.04) {
    this.polyline = new Polyline(lineString);
    this.previousDistance = 0;
    this.currentDistance = 0;
    this.baseSpeed = speed;
    this.speedMultiplier = 1;
    this.isRunning = false;
  }

  addListener(
    listener: (
      point: GeoJSON.Feature<
        GeoJSON.Point,
        { distance: number; nearestIndex: number }
      >,
    ) => void,
  ) {
    this.listener = listener;
  }

  setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  getSpeed(): number {
    return this.baseSpeed * this.speedMultiplier;
  }

  pause() {
    this.isRunning = false;
    if (this.anim) {
      this.anim.stop();
    }
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.tick();
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  jumpToDistance(distance: number) {
    const wasRunning = this.isRunning;
    if (this.anim) {
      this.anim.stop();
    }
    
    this.currentDistance = Math.min(distance, this.polyline.totalDistance);
    this.previousDistance = this.currentDistance;
    
    // Emit current position immediately
    const currentPosition = this.polyline.coordinateFromStart(this.currentDistance);
    this.emit(currentPosition);
    
    if (wasRunning) {
      this.tick();
    }
  }

  getCurrentDistance(): number {
    return this.currentDistance;
  }

  getTotalDistance(): number {
    return this.polyline.totalDistance;
  }

  start() {
    this.isRunning = true;
    this.tick();
  }

  reset() {
    this.previousDistance = 0;
    this.currentDistance = 0;
    this.isRunning = true;
    this.start();
  }

  stop() {
    this.isRunning = false;
    if (this.anim) {
      this.anim.stop();
    }
  }

  tick() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => {
      this.previousDistance = this.currentDistance;
      this.currentDistance += this.getSpeed();

      // interpolate between previous to current distance
      const listener: Animated.ValueListenerCallback = (step) => {
        const currentPosition = this.polyline.coordinateFromStart(step.value);
        this.emit(currentPosition);
      };

      this.animatedValue = new Animated.Value(
        this.previousDistance,
      ) as Animated.Value;
      const listenerId = this.animatedValue.addListener(listener);

      this.anim = Animated.timing(this.animatedValue, {
        toValue: this.currentDistance,
        duration: 5,
        useNativeDriver: false,
      });

      this.anim.start(() => {
        this.animatedValue?.removeListener(listenerId);

        if (this.currentDistance > this.polyline.totalDistance) {
          this.reset();
          return;
        }

        if (this.isRunning) {
          this.tick();
        }
      });
    });
  }

  emit(pointFeature: RouteSimulatorFeature) {
    this.listener?.(pointFeature);
  }
}
