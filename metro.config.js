const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation loads a WebAssembly build (wa-sqlite) that
// Metro doesn't treat as an asset by default, and needs cross-origin isolation
// (COOP/COEP) to use SharedArrayBuffer in the browser.
config.resolver.assetExts.push('wasm');

const originalMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (metroMiddleware, server) => {
  const middleware = originalMiddleware ? originalMiddleware(metroMiddleware, server) : metroMiddleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    middleware(req, res, next);
  };
};

module.exports = config;
