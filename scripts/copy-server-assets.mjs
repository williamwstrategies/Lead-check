import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'server', 'services', 'pitchproofAnalyzer.cjs');
const destinationDir = path.join(root, 'dist', 'server', 'server', 'services');
const destination = path.join(destinationDir, 'pitchproofAnalyzer.cjs');

await mkdir(destinationDir, { recursive: true });
await copyFile(source, destination);
