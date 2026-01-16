import test from 'node:test';
import assert from 'node:assert';
import { ConfigDetector } from '../lib/config-detector.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('ConfigDetector - detectExistingConfig', () => {
  // Point to our mock directory instead of real CWD
  const mockRepoRoot = join(__dirname, 'mocks');
  const detector = new ConfigDetector(mockRepoRoot);
  
  // Override the internal workflowDir for testing
  detector.workflowDir = join(mockRepoRoot, '.github/workflows');

  const config = detector.detectExistingConfig('docker-ops');

  assert.strictEqual(config.image_name, 'detected-image', 'Should detect image_name');
  assert.strictEqual(config.build_platforms, 'linux/amd64', 'Should detect build_platforms');
});
