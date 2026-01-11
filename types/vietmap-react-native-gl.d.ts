// Minimal TypeScript declarations to silence TS for VietMap GL packages.
// Extend as needed with stricter types.

declare module '@vietmap/react-native-gl' {
  export interface CameraBounds {
    ne: [number, number]
    sw: [number, number]
  }
  export interface CameraProps {
    bounds?: { ne: [number, number]; sw: [number, number] }
    padding?: { top?: number; bottom?: number; left?: number; right?: number }
    animationDuration?: number
  }
  export interface LineLayerStyle {
    lineColor?: string
    lineWidth?: number
    lineOpacity?: number
    lineJoin?: 'bevel' | 'round' | 'miter'
    lineCap?: 'butt' | 'round' | 'square'
  }
  export interface PointAnnotationProps {
    id: string
    coordinate: [number, number]
    anchor?: { x: number; y: number }
    children?: React.ReactNode
  }
  export const MapView: React.ComponentType<any>
  export const Camera: React.ComponentType<CameraProps>
  export const ShapeSource: React.ComponentType<any>
  export const LineLayer: React.ComponentType<{ id: string; style?: LineLayerStyle }>
  export const PointAnnotation: React.ComponentType<PointAnnotationProps>
  const VietMapGL: any
  export default VietMapGL
}

declare module '@vietmap/vietmap-gl-react-native' {
  export interface CameraBounds {
    ne: [number, number]
    sw: [number, number]
  }
  export interface CameraProps {
    bounds?: { ne: [number, number]; sw: [number, number] }
    padding?: { top?: number; bottom?: number; left?: number; right?: number }
    animationDuration?: number
  }
  export interface LineLayerStyle {
    lineColor?: string
    lineWidth?: number
    lineOpacity?: number
    lineJoin?: 'bevel' | 'round' | 'miter'
    lineCap?: 'butt' | 'round' | 'square'
  }
  export interface PointAnnotationProps {
    id: string
    coordinate: [number, number]
    anchor?: { x: number; y: number }
    children?: React.ReactNode
  }
  export const MapView: React.ComponentType<any>
  export const Camera: React.ComponentType<CameraProps>
  export const ShapeSource: React.ComponentType<any>
  export const LineLayer: React.ComponentType<{ id: string; style?: LineLayerStyle }>
  export const PointAnnotation: React.ComponentType<PointAnnotationProps>
  const VietMapGL: any
  export default VietMapGL
}

declare module '@vietmap/vietmap-api' {
  export class Polyline {
    decode(polyline: string, precision?: number): number[][]
  }
}
