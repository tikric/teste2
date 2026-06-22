import fs from 'fs';
import path from 'path';

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    // Skip server.cjs and its sourcemap
    const filename = path.basename(src);
    if (filename !== 'server.cjs' && filename !== 'server.cjs.map') {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      console.log(`Copied ${src} -> ${dest}`);
    }
  }
}

const srcDir = path.resolve('./dist');
const destDirs = [
  path.resolve('./app/src/main/assets'),
  path.resolve('./app/app/src/main/assets')
];

destDirs.forEach((destDir) => {
  // Only copy to directories that make physical sense (i.e. we don't want app/app/app/src/main/assets if called in nested scope)
  if (destDir.indexOf('/app/app/app/') !== -1) {
    return;
  }
  console.log(`Starting asset copy from ${srcDir} to ${destDir}...`);
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
    console.log(`Cleaned existing assets directory at: ${destDir}`);
  }
  // Ensure target folder exists
  fs.mkdirSync(destDir, { recursive: true });
  copyRecursiveSync(srcDir, destDir);
});
console.log('Asset copy finished successfully.');
