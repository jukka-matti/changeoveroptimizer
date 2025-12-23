# TD-06: Build & Distribution

**Electron Forge Packaging, Signing, and Auto-Updates**

---

## Purpose

This document specifies how ChangeoverOptimizer is built, signed, and distributed for Windows, macOS, and Linux using Electron Forge. It covers:
- Build configuration (Electron Forge)
- Code signing (Windows & macOS)
- Auto-updates (electron-updater)
- CI/CD pipeline (GitHub Actions)
- Distribution channels

---

## Platform Targets

| Platform | Format | Min Version | Architecture | Renderer |
|----------|--------|-------------|--------------|----------|
| Windows | .exe (Squirrel), .zip | Windows 10 | x64 | Chromium (bundled) |
| macOS | .dmg, .app | macOS 11 (Big Sur) | x64 + arm64 (Universal) | Chromium (bundled) |
| Linux | .deb, .rpm, .zip | Ubuntu 22.04+ | x64 | Chromium (bundled) |

### Chromium Bundling

Electron bundles Chromium, ensuring consistent rendering across all platforms. The installer size is larger (~100MB) but provides guaranteed compatibility.

---

## 1. Project Structure

```
changeoveroptimizer/
├── src-electron/                 # TypeScript backend (main process)
│   ├── main.ts                   # Entry point
│   ├── preload.ts                # Security bridge
│   ├── ipc-handlers.ts           # IPC handlers
│   ├── storage.ts                # Template storage
│   ├── window-state.ts           # Window state
│   └── types.ts                  # TypeScript interfaces
├── forge.config.ts               # Electron Forge config
├── tsconfig.electron.json        # TypeScript config (main)
├── vite.main.config.ts           # Vite config (main)
├── vite.preload.config.ts        # Vite config (preload)
├── src/                          # React frontend
│   ├── main.tsx
│   └── ...
├── public/
├── dist/                         # Vite build output (renderer)
├── out/                          # Electron Forge build output
│   └── make/                     # Final installers
│       ├── squirrel.windows/     # Windows .exe
│       ├── zip/                  # .zip archives
│       ├── dmg/                  # macOS .dmg
│       ├── deb/                  # Linux .deb
│       └── rpm/                  # Linux .rpm
├── .vite/                        # Vite build cache
│   ├── build/                    # Built main/preload
│   └── dev-dist/                 # Dev build
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 2. Package Configuration

### package.json

```json
{
  "name": "changeoveroptimizer",
  "version": "1.0.0",
  "description": "Optimize production schedules to minimize changeover time",
  "type": "module",
  "author": {
    "name": "RDMAIC Oy",
    "email": "support@changeoveroptimizer.com"
  },
  "homepage": "https://changeoveroptimizer.com",
  "license": "UNLICENSED",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:debug": "tauri build --debug",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:rust": "cd src-tauri && cargo test"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.x",
    "@radix-ui/react-select": "^2.1.x",
    "@tauri-apps/api": "^2.x",
    "@tauri-apps/plugin-dialog": "^2.x",
    "@tauri-apps/plugin-fs": "^2.x",
    "@tauri-apps/plugin-store": "^2.x",
    "@tauri-apps/plugin-updater": "^2.x",
    "i18next": "^24.x",
    "lucide-react": "^0.460.x",
    "pdfmake": "^0.2.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-i18next": "^15.x",
    "xlsx": "^0.20.x",
    "zustand": "^5.x"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.x",
    "@types/node": "^22.x",
    "@types/react": "^19.x",
    "@types/react-dom": "^19.x",
    "@vitejs/plugin-react": "^4.x",
    "autoprefixer": "^10.x",
    "eslint": "^9.x",
    "postcss": "^8.x",
    "tailwindcss": "^4.x",
    "typescript": "^5.x",
    "vite": "^6.x",
    "vitest": "^2.x"
  }
}
```

### forge.config.ts

```typescript
// forge.config.ts

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
```

---

## 3. Tauri Configuration

### tauri.conf.json

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "ChangeoverOptimizer",
  "version": "1.0.0",
  "identifier": "com.changeoveroptimizer.app",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "windows": [
      {
        "title": "ChangeoverOptimizer",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.paddle.com https://changeoveroptimizer.com https://updates.changeoveroptimizer.com"
    }
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [
      "resources/*"
    ],
    "targets": "all",
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com",
      "webviewInstallMode": {
        "type": "embedBootstrapper"
      },
      "nsis": {
        "installerIcon": "icons/icon.ico",
        "headerImage": "icons/nsis-header.bmp",
        "sidebarImage": "icons/nsis-sidebar.bmp",
        "license": "resources/license.txt",
        "installMode": "currentUser",
        "languages": ["English", "German", "Finnish", "Swedish"]
      }
    },
    "macOS": {
      "entitlements": "entitlements.plist",
      "minimumSystemVersion": "11.0",
      "frameworks": [],
      "signingIdentity": null,
      "providerShortName": null
    },
    "linux": {
      "appimage": {
        "bundleMediaFramework": false
      },
      "deb": {
        "depends": ["libwebkit2gtk-4.1-0", "libgtk-3-0"]
      }
    }
  },
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://updates.changeoveroptimizer.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

### Capabilities (Permissions)

```json
// src-tauri/capabilities/main.json
{
  "$schema": "https://schemas.tauri.app/config/2/capability",
  "identifier": "main",
  "description": "Main window capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-maximize",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "dialog:allow-message",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    {
      "identifier": "fs:scope",
      "allow": [
        "$DOCUMENT/**",
        "$DOWNLOAD/**",
        "$HOME/**"
      ]
    },
    "store:default",
    "updater:default"
  ]
}
```

---

## 4. Code Signing

### Windows Code Signing

Windows requires code signing to avoid SmartScreen warnings. Options:

| Certificate Type | Cost | SmartScreen | Use Case |
|-----------------|------|-------------|----------|
| OV (Organization Validation) | ~$200/yr | Builds trust over time | Standard |
| EV (Extended Validation) | ~$400/yr | Immediate trust | Enterprise |

#### Setup with Azure Key Vault (Recommended for CI)

```bash
# Environment variables for GitHub Actions
AZURE_KEY_VAULT_URI=https://your-vault.vault.azure.net/
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
AZURE_CERT_NAME=your-certificate-name
```

```json
// tauri.conf.json
{
  "bundle": {
    "windows": {
      "signCommand": "AzureSignTool sign -kvu %AZURE_KEY_VAULT_URI% -kvi %AZURE_CLIENT_ID% -kvs %AZURE_CLIENT_SECRET% -kvt %AZURE_TENANT_ID% -kvc %AZURE_CERT_NAME% -tr http://timestamp.digicert.com -td sha256 \"%1\""
    }
  }
}
```

#### Setup with Local Certificate

```bash
# Environment variables
TAURI_SIGNING_PRIVATE_KEY=path/to/certificate.pfx
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=your-password
```

### macOS Code Signing & Notarization

macOS requires both signing and notarization for Gatekeeper approval.

#### Prerequisites

1. Apple Developer Program membership ($99/year)
2. Developer ID Application certificate
3. App-specific password for notarization

#### Environment Variables

```bash
# For CI/CD
APPLE_CERTIFICATE=base64-encoded-p12
APPLE_CERTIFICATE_PASSWORD=certificate-password
APPLE_ID=your-apple-id@example.com
APPLE_PASSWORD=app-specific-password
APPLE_TEAM_ID=your-team-id
APPLE_SIGNING_IDENTITY="Developer ID Application: Your Company (TEAM_ID)"
```

#### Entitlements

```xml
<!-- src-tauri/entitlements.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
```

---

## 5. Auto-Updates

### Update Server Setup

Tauri updater expects a JSON response from your update endpoint:

```json
// Response from https://updates.changeoveroptimizer.com/windows/x86_64/1.0.0
{
  "version": "1.1.0",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2024-12-20T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://releases.changeoveroptimizer.com/ChangeoverOptimizer-1.1.0-win-x64.exe"
    }
  }
}
```

### Generate Update Signing Keys

```bash
# Generate key pair (do this once, keep private key secret!)
npm run tauri signer generate -- -w ~/.tauri/changeoveroptimizer.key

# This creates:
# ~/.tauri/changeoveroptimizer.key (PRIVATE - keep secret!)
# ~/.tauri/changeoveroptimizer.key.pub (PUBLIC - add to tauri.conf.json)
```

### Rust Backend

```rust
// src-tauri/src/main.rs

use tauri::Manager;
use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Check for updates on startup (optional)
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = check_for_updates(handle).await {
                    eprintln!("Update check failed: {}", e);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ... your commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn check_for_updates(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let updater = app.updater()?;
    
    if let Some(update) = updater.check().await? {
        println!("Update available: {}", update.version);
        // Emit event to frontend
        app.emit("update-available", &update.version)?;
    }
    
    Ok(())
}
```

### Frontend Integration

```typescript
// src/lib/updater.ts

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  version: string;
  body?: string;
  date?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const update = await check();
    
    if (update) {
      return {
        version: update.version,
        body: update.body,
        date: update.date,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Update check failed:', error);
    return null;
  }
}

export async function downloadAndInstall(
  onProgress?: (progress: number) => void
): Promise<void> {
  const update = await check();
  
  if (!update) {
    throw new Error('No update available');
  }
  
  let downloaded = 0;
  let contentLength = 0;
  
  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        contentLength = event.data.contentLength ?? 0;
        break;
      case 'Progress':
        downloaded += event.data.chunkLength;
        if (onProgress && contentLength > 0) {
          onProgress((downloaded / contentLength) * 100);
        }
        break;
      case 'Finished':
        break;
    }
  });
  
  // Restart to apply update
  await relaunch();
}
```

### Update UI Component

```typescript
// src/components/features/UpdateNotification.tsx

import { useState, useEffect } from 'react';
import { checkForUpdates, downloadAndInstall, UpdateInfo } from '@/lib/updater';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, CheckCircle, Loader2 } from 'lucide-react';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready';

export function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Check for updates on mount
    checkUpdates();
  }, []);
  
  async function checkUpdates() {
    setStatus('checking');
    const info = await checkForUpdates();
    
    if (info) {
      setUpdate(info);
      setStatus('available');
    } else {
      setStatus('idle');
    }
  }
  
  async function handleDownload() {
    setStatus('downloading');
    setProgress(0);
    
    try {
      await downloadAndInstall((p) => setProgress(p));
      setStatus('ready');
    } catch (error) {
      console.error('Download failed:', error);
      setStatus('available');
    }
  }
  
  if (status === 'idle' || status === 'checking') {
    return null;
  }
  
  if (status === 'available' && update) {
    return (
      <Alert className="fixed bottom-4 right-4 w-80 shadow-lg">
        <Download className="h-4 w-4" />
        <AlertTitle>Update Available</AlertTitle>
        <AlertDescription>
          <p className="mb-2">Version {update.version} is ready.</p>
          <Button size="sm" onClick={handleDownload}>
            Download & Install
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (status === 'downloading') {
    return (
      <Alert className="fixed bottom-4 right-4 w-80 shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Downloading Update</AlertTitle>
        <AlertDescription>
          <Progress value={progress} className="mt-2" />
          <span className="text-xs text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (status === 'ready') {
    return (
      <Alert className="fixed bottom-4 right-4 w-80 shadow-lg border-green-500">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle>Restarting...</AlertTitle>
        <AlertDescription>
          Installing update and restarting application.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
```

---

## 6. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/build.yml

name: Build & Release

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}

jobs:
  # ===========================================================================
  # TEST
  # ===========================================================================
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install Linux dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Test (Frontend)
        run: npm test
      
      - name: Test (Rust)
        run: npm run test:rust

  # ===========================================================================
  # BUILD
  # ===========================================================================
  build:
    needs: test
    if: startsWith(github.ref, 'refs/tags/v')
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: windows-latest
            target: x86_64-pc-windows-msvc
          - platform: macos-latest
            target: aarch64-apple-darwin
          - platform: macos-latest
            target: x86_64-apple-darwin
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}
      
      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: src-tauri -> target
      
      # Linux dependencies
      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
      
      - name: Install dependencies
        run: npm ci
      
      # Windows: Import certificate
      - name: Import Windows certificate
        if: matrix.platform == 'windows-latest'
        env:
          WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
          WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
        run: |
          New-Item -ItemType directory -Path certificate
          Set-Content -Path certificate/cert.txt -Value $env:WINDOWS_CERTIFICATE
          certutil -decode certificate/cert.txt certificate/cert.pfx
          Remove-Item certificate/cert.txt
        shell: pwsh
      
      # macOS: Import certificate
      - name: Import macOS certificate
        if: matrix.platform == 'macos-latest'
        env:
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}
        run: |
          echo $APPLE_CERTIFICATE | base64 --decode > certificate.p12
          security create-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
          security import certificate.p12 -k build.keychain -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" build.keychain
          rm certificate.p12
      
      # Build
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # Windows signing
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
          # macOS signing
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        with:
          tagName: v__VERSION__
          releaseName: 'ChangeoverOptimizer v__VERSION__'
          releaseBody: 'See the assets to download this version and install.'
          releaseDraft: true
          prerelease: false
          args: --target ${{ matrix.target }}
      
      # Upload artifacts
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: changeoveroptimizer-${{ matrix.target }}
          path: |
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.exe
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.msi
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.dmg
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.app
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.deb
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.AppImage

  # ===========================================================================
  # PUBLISH UPDATE MANIFEST
  # ===========================================================================
  publish-update:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts
      
      - name: Generate update manifest
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          # Script to generate update JSON manifest
          node scripts/generate-update-manifest.js $VERSION
      
      - name: Upload to update server
        env:
          UPDATE_SERVER_KEY: ${{ secrets.UPDATE_SERVER_KEY }}
        run: |
          # Upload manifest and artifacts to your update server
          curl -X POST https://updates.changeoveroptimizer.com/publish \
            -H "Authorization: Bearer $UPDATE_SERVER_KEY" \
            -F "manifest=@update-manifest.json"
```

---

## 7. Build Commands

### Development

```bash
# Start development server (frontend + Electron)
npm run electron:dev

# Frontend only
npm run dev
```

### Production Build

```bash
# Build for current platform
npm run electron:build

# Package without creating installers
npm run electron:package

# Build for specific platform (configure in forge.config.ts)
npm run electron:build -- --platform darwin
npm run electron:build -- --platform win32
npm run electron:build -- --platform linux
```

### Output Locations

| Platform | Format | Location |
|----------|--------|----------|
| Windows | .exe (Squirrel) | `out/make/squirrel.windows/x64/ChangeoverOptimizer-1.0.0 Setup.exe` |
| Windows | .zip | `out/make/zip/win32/x64/changeoveroptimizer-win32-x64-1.0.0.zip` |
| macOS | .dmg | `out/make/ChangeoverOptimizer-1.0.0-arm64.dmg` |
| macOS | .app | `out/ChangeoverOptimizer-darwin-universal/ChangeoverOptimizer.app` |
| Linux | .deb | `out/make/deb/x64/changeoveroptimizer_1.0.0_amd64.deb` |
| Linux | .rpm | `out/make/rpm/x64/changeoveroptimizer-1.0.0-1.x86_64.rpm` |

---

## 8. Release Process

### Version Bump

```bash
# Update version in package.json
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Also update src-tauri/tauri.conf.json and src-tauri/Cargo.toml
```

### Release Checklist

1. **Pre-release**
   - [ ] Update CHANGELOG.md
   - [ ] Bump version in package.json, tauri.conf.json, Cargo.toml
   - [ ] Run full test suite
   - [ ] Test build locally on all platforms

2. **Release**
   - [ ] Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
   - [ ] Push tag: `git push origin v1.0.0`
   - [ ] Wait for CI to build all platforms
   - [ ] Review draft release in GitHub
   - [ ] Test installers from draft release

3. **Post-release**
   - [ ] Publish release (removes draft status)
   - [ ] Verify auto-update works from previous version
   - [ ] Update website download links
   - [ ] Announce release

---

## 9. Distribution Channels

### Primary: Website Direct Download

```
https://changeoveroptimizer.com/download
├── /windows  → ChangeoverOptimizer-1.0.0-win-x64.exe
├── /mac      → ChangeoverOptimizer-1.0.0-mac-universal.dmg
└── /linux    → ChangeoverOptimizer-1.0.0-linux-x64.AppImage
```

### Secondary: GitHub Releases

All builds are published to GitHub Releases for transparency and as a CDN.

### Future: Microsoft Store (Optional)

Tauri supports MSIX packaging for Microsoft Store distribution if needed later.

---

## 10. Installer Sizes

| Platform | Estimated Size | Notes |
|----------|---------------|-------|
| Windows (.exe) | 8-12 MB | Includes WebView2 bootstrapper |
| Windows (offline) | ~130 MB | With embedded WebView2 |
| macOS (.dmg) | 10-15 MB | Universal binary (x64 + arm64) |
| Linux (.AppImage) | 8-12 MB | Self-contained |
| Linux (.deb) | 4-6 MB | Requires system WebKitGTK |

---

## Appendix A: Troubleshooting

### Windows Build Issues

```bash
# If NSIS build fails
# Install NSIS: https://nsis.sourceforge.io/Download

# If code signing fails
# Verify certificate is valid and not expired
certutil -dump certificate.pfx
```

### macOS Build Issues

```bash
# If signing fails
security find-identity -v -p codesigning

# If notarization fails
xcrun notarytool log <submission-id> --apple-id $APPLE_ID --password $APPLE_PASSWORD --team-id $APPLE_TEAM_ID
```

### Linux Build Issues

```bash
# Missing dependencies
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# AppImage not launching
chmod +x ChangeoverOptimizer.AppImage
```

---

## Appendix B: Security Notes

### Update Signature Verification

Tauri updater verifies all updates using Ed25519 signatures:

1. Private key signs the update during build
2. Public key in `tauri.conf.json` verifies downloads
3. Signature mismatch = update rejected

**Never commit your private key to version control!**

### CSP (Content Security Policy)

The CSP in `tauri.conf.json` restricts what the WebView can do:
- `default-src 'self'`: Only load resources from app bundle
- `connect-src`: Whitelist API endpoints (Paddle, update server)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-20 | Complete rewrite for Tauri 2.x |
| 0.1 | 2024-12-15 | Initial Electron version |
