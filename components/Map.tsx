import React from 'react';
import { Image, View, StyleSheet, ImageSourcePropType } from 'react-native';

interface MapProps {
  style?: object;
  showRoute?: boolean;
}

const Map: React.FC<MapProps> = ({ style, showRoute = false }) => {
  const mapImageUrl = showRoute 
    ? "https://storage.googleapis.com/maker-studio-project-media-prod/media/2919/1721614777264_google_map_with_route.png"
    : "https://storage.googleapis.com/maker-studio-project-media-prod/media/2919/1721614766943_google_map_static.png";
    
  return (
    <View style={[styles.container, style]}>
      <Image 
        source={{ uri: mapImageUrl }} 
        style={styles.mapImage}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
});

export default Map;
