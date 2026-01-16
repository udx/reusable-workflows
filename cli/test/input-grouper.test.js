import test from 'node:test';
import assert from 'node:assert';
import { InputGrouper } from '../lib/input-grouper.js';
import { CLI_CONFIG } from '../config.js';

test('InputGrouper - groupInputsByPrefix', () => {
  const grouper = new InputGrouper(CLI_CONFIG);
  const inputs = {
    image_name: { description: 'Common: Name of the image' },
    docker_login: { description: 'Docker Hub: Username' },
    gcp_region: { description: 'GCP: Region' }
  };

  const groups = grouper.groupInputsByPrefix(inputs);

  assert.ok(groups.common, 'Should have common group');
  assert.ok(groups['docker-hub'], 'Should have docker-hub group');
  assert.ok(groups['gcp'], 'Should have gcp group');

  assert.strictEqual(groups.common.length, 1);
  assert.strictEqual(groups['docker-hub'].length, 1);
  assert.strictEqual(groups['docker-hub'][0].prefix, 'Docker Hub');
});

test('InputGrouper - extractPrompt', () => {
  const grouper = new InputGrouper(CLI_CONFIG);
  
  const prompt1 = grouper.extractPrompt('Docker Hub: Username (required)');
  assert.strictEqual(prompt1, 'Username');

  const prompt2 = grouper.extractPrompt('Image name');
  assert.strictEqual(prompt2, 'Image name');
});
