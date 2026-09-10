import fs from 'fs';
import path from 'path';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('png');
Config.setChromiumOpenGlRenderer('angle');
Config.setChromiumMultiProcessOnLinux(true);
Config.setHardwareAcceleration('required');

Config.overrideFfmpegCommand(({type, args}) => {
  if (type === 'pre-stitcher') {
    const newArgs = [...args];
    for (let i = 0; i < newArgs.length; i++) {
      if (newArgs[i] === '-c:v' && newArgs[i + 1] === 'libx264') {
        newArgs[i + 1] = 'h264_nvenc';
      }
      if (newArgs[i] === '-crf') {
        newArgs[i] = '-cq';
      }
    }
    return newArgs;
  }
  return args;
});

// Robust motion-kit path resolution regardless of invocation CWD
const motionKitPath = fs.existsSync(path.resolve(process.cwd(), 'motion-kit'))
  ? path.resolve(process.cwd(), 'motion-kit')
  : path.resolve(process.cwd(), '../motion-kit');

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
