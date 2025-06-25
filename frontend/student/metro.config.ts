import { getDefaultConfig } from 'expo/metro-config';

export default (async () => {
  const config = await getDefaultConfig(__dirname);

  if (config.resolver) {
    config.resolver.assetExts = config.resolver.assetExts
      ? [...config.resolver.assetExts, 'glb']
      : ['glb'];
  }

  return config;
})();
