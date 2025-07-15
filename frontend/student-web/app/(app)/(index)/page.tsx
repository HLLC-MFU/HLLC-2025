'use client';

const baseImageUrl = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {

  const assetsImage = {
    lamduan: null,
    profile: null,
    notification: null,
    background: null,
    progress: null,
  };


  return (
    <div
      className="relative flex flex-col max-h-full w-full bg-cover bg-center bg-no-repeat text-white px-4 pt-6 md:pt-12 pb-28"
      style={{
        backgroundImage: `url(${baseImageUrl}/uploads/${assetsImage.background || 'default-bg.jpg'})`,
      }}
    />
  );
}
