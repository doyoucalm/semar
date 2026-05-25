import type { NextConfig } from 'next';

const SEMAR_PACKAGES = [
  '@semar/bazi',
  '@semar/tarot',
  '@semar/iching',
  '@semar/astrology',
  '@semar/pawukon',
  '@semar/numerology',
  '@semar/zwds',
];

const config: NextConfig = {
  transpilePackages: SEMAR_PACKAGES,
  webpack(webpackConfig) {
    // Resolve .js imports in ESM packages to their .ts source
    webpackConfig.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return webpackConfig;
  },
};

export default config;
