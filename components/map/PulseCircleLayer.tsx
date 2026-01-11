import React, { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import VietMapGLWrapper from './VietMapGLWrapper'

const styles: {
  innerCircle: Record<string, any>
  innerCirclePulse: Record<string, any>
  outerCircle: Record<string, any>
} = {
  innerCircle: {
    circleColor: 'white',
    circleStrokeWidth: 1,
    circleStrokeColor: '#c6d2e1'
  },
  innerCirclePulse: {
    circleColor: '#4264fb',
    circleStrokeColor: '#c6d2e1',
    circleStrokeWidth: 1
  },
  outerCircle: {
    circleOpacity: 0.4,
    circleColor: '#c6d2e1'
  }
}

interface PulseCircleLayerProps {
  radius?: number
  pulseRadius?: number
  duration?: number
  shape?: GeoJSON.Feature<GeoJSON.Point> | GeoJSON.Point
  aboveLayerID?: string
}

const PulseCircleLayer: React.FC<PulseCircleLayerProps> = ({
  radius = 6,
  pulseRadius = 20,
  duration = 1000,
  shape,
  aboveLayerID
}) => {
  const animatedRadius = useRef(new Animated.Value(radius * 0.5)).current
  const animatedPulseOpacity = useRef(new Animated.Value(1)).current
  const animatedPulseRadius = useRef(new Animated.Value(radius)).current

  useEffect(() => {
    const growAnimation = Animated.parallel([
      Animated.timing(animatedRadius, {
        toValue: radius * 0.7,
        duration: duration / 2,
        useNativeDriver: false
      }),
      Animated.timing(animatedPulseRadius, {
        toValue: pulseRadius,
        duration,
        useNativeDriver: false
      }),
      Animated.timing(animatedPulseOpacity, {
        toValue: 0,
        duration,
        useNativeDriver: false
      })
    ])

    const shrinkAnimation = Animated.parallel([
      Animated.timing(animatedRadius, {
        toValue: radius * 0.5,
        duration: duration / 2,
        useNativeDriver: false
      }),
      Animated.timing(animatedPulseRadius, {
        toValue: radius,
        duration: duration / 2,
        useNativeDriver: false
      })
    ])

    const animationLoop = Animated.loop(
      Animated.sequence([growAnimation, shrinkAnimation])
    )

    animationLoop.start()

    return () => {
      animationLoop.stop()
    }
  }, [radius, pulseRadius, duration, animatedRadius, animatedPulseOpacity, animatedPulseRadius])

  if (!shape) {
    return null
  }

  const { ShapeSource, CircleLayer } = VietMapGLWrapper as any
  const AnimatedShapeSource = Animated.createAnimatedComponent(ShapeSource)
  const AnimatedCircleLayer = Animated.createAnimatedComponent(CircleLayer)

  return (
    <AnimatedShapeSource id="pulseCircleSource" shape={shape}>
<AnimatedCircleLayer
        id="pulseOuterCircle"
        aboveLayerID={aboveLayerID}
        style={{
          ...styles.outerCircle,
          circleRadius: animatedPulseRadius,
          circleOpacity: animatedPulseOpacity
        }}
      />
<AnimatedCircleLayer
        id="pulseInnerCircleCnt"
        aboveLayerID="pulseOuterCircle"
        style={{ ...styles.innerCircle, circleRadius: radius }}
      />
<AnimatedCircleLayer
        id="pulseInnerCircle"
        aboveLayerID="pulseInnerCircleCnt"
        style={{ ...styles.innerCirclePulse, circleRadius: animatedRadius }}
      />
</AnimatedShapeSource>
  )
}

export default PulseCircleLayer
