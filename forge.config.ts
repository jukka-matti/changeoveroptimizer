import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'ChangeoverOptimizer',
    executableName: 'changeoveroptimizer',
    appBundleId: 'com.changeoveroptimizer.app',
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'ChangeoverOptimizer',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      name: 'ChangeoverOptimizer',
    }),
    new MakerDeb({
      options: {
        name: 'changeoveroptimizer',
        productName: 'ChangeoverOptimizer',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src-electron/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src-electron/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.config.ts',
        },
      ],
    }),
  ],
};

export default config;
