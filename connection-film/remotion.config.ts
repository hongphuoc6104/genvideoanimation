import path from 'path';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('png');
Config.setChromiumOpenGlRenderer('angle');
Config.setChromiumMultiProcessOnLinux(true);

// Webpack alias fallback for motion-kit to guarantee zero bundler resolution failures
// Remotion CLI evaluates remotion.config.ts via eval() inside @remotion/cli/dist/load-config.js,
// so __dirname in eval evaluates to @remotion/cli/dist. We resolve from process.cwd() to locate motion-kit.
const motionKitPath = path.resolve(process.cwd(), '../motion-kit');

Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...(currentConfiguration.resolve?.alias ?? {}),
        'motion-kit': motionKitPath,
      },
    },
  };
});
