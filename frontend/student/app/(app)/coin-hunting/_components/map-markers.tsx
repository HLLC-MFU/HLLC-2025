import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';

// 🎯 Marker positions (pixel coordinates relative to original image)
// Mockup: เพิ่มข้อมูล image, description, mapsUrl
const markers = [
  {
    x: 600,
    y: 1100,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    description:
      'ใต้ถุนอาคาร E2 ประกอบด้วยร้านอาหาร 8 ร้าน ร้านอาหารว่างและเครื่องดื่ม 3 ร้าน เปิดบริการตั้งแต่เวลา 07.00 - 18.00 น.ทุกวัน ด้วยความจุ 350 ที่นั่ง สามารถรองรับผู้ใช้บริการได้กว่า 1,500 คนต่อวัน',
    mapsUrl: 'https://maps.app.goo.gl/FUoQPiJTsr6rQHAQA?g_st=ipc',
  },
  {
    x: 900,
    y: 400,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    description:
      'ใต้ถุนอาคาร E2 ประกอบด้วยร้านอาหาร 8 ร้าน ร้านอาหารว่างและเครื่องดื่ม 3 ร้าน เปิดบริการตั้งแต่เวลา 07.00 - 18.00 น.ทุกวัน ด้วยความจุ 350 ที่นั่ง สามารถรองรับผู้ใช้บริการได้กว่า 1,500 คนต่อวัน',
    mapsUrl: 'https://maps.app.goo.gl/FUoQPiJTsr6rQHAQA?g_st=ipc',
  },
];

interface MapMarkersProps {
  onMarkerPress: (marker: typeof markers[0]) => void;
}

export default function MapMarkers({ onMarkerPress }: MapMarkersProps) {
  return (
    <>
      {/* 📌 Markers */}
      {markers.map((m, i) => (
        <TouchableOpacity
          key={i}
          style={[
            {
              position: 'absolute',
              width: 20,
              height: 20,
              backgroundColor: 'red',
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#fff',
              zIndex: 5,
              top: m.y,
              left: m.x,
            } as ViewStyle,
          ]}
          onPress={() => onMarkerPress(m)}
          activeOpacity={0.7}
        />
      ))}
    </>
  );
}

export { markers }; 