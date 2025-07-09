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
                src={mapUrl}
                width="100%"
                height="250"
                allowFullScreen
            ></iframe>
        </div>
    );
}
