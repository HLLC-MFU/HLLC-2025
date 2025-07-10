type EmbedMapProps = {
  lat?: number;
  lng?: number;
};

export default function EmbedMap({ lat, lng }: EmbedMapProps) {
  if (!lat || !lng) return <p>No location provided</p>;

  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div className="w-full max-h-screen">
      <iframe
        allowFullScreen
        height="250"
        src={mapUrl}
        title={`Google Map at ${lat},${lng}`}
        width="100%"
      />
    </div>
  );
}
