import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync, readdirSync, lstatSync, rmSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import chalk from 'chalk';

import { CLI_CONFIG } from '../config.js';
import { TemplateLoader } from '../lib/template-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const TEMP_DIR = join(__dirname, 'ux-temp-runner');
const CASES_DIR = join(__dirname, 'ux-cases');

/**
 * Asset-Driven UX Test Runner
 * Verifies CLI output against source templates and example files.
 */
class UXTestRunner {
  constructor() {
    this.templateLoader = new TemplateLoader(REPO_ROOT, CLI_CONFIG);
  }

  async run() {
    console.log(chalk.blue('🚀 Starting Asset-Driven UX Tests...'));

    const cases = this.findCases(CASES_DIR);
    let passed = 0;
    let failed = 0;

    for (const casePath of cases) {
      const caseName = relative(CASES_DIR, casePath);
      try {
        await this.runTestCase(casePath);
        console.log(chalk.green(`  ✅ PASSED: ${caseName}`));
        passed++;
      } catch (error) {
        console.log(chalk.red(`  ❌ FAILED: ${caseName}`));
        console.error(chalk.yellow(`     Reason: ${error.message}`));
        failed++;
      }
    }

    console.log('\n' + chalk.blue('══════════════════════════════════════════════════'));
    console.log(chalk.white(`  Total: ${passed + failed} | `) + chalk.green(`Passed: ${passed}`) + chalk.white(' | ') + chalk.red(`Failed: ${failed}`));
    console.log(chalk.blue('══════════════════════════════════════════════════') + '\n');

    if (failed > 0) {
      process.exit(1);
    }
  }

  findCases(dir) {
    let results = [];
    const list = readdirSync(dir);
    for (const file of list) {
      const path = join(dir, file);
      const stat = lstatSync(path);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.findCases(path));
      } else if (file.endsWith('.json')) {
        results.push(path);
      }
    }
    return results;
  }

  async runTestCase(casePath) {
    const testCase = JSON.parse(readFileSync(casePath, 'utf8'));
    const testWorkDir = join(TEMP_DIR, relative(CASES_DIR, casePath).replace('.json', ''));

    // Clean and prepare workdir
    if (existsSync(testWorkDir)) rmSync(testWorkDir, { recursive: true, force: true });
    mkdirSync(testWorkDir, { recursive: true });

    // 0. Setup fixture if specified
    if (testCase.setup) {
      const fixtureDir = join(REPO_ROOT, 'cli/test/cases', testCase.setup);
      if (existsSync(fixtureDir)) {
        execSync(`cp -r "${fixtureDir}"/. "${testWorkDir}/"`);
      }
    }

    // Run CLI
    const args = testCase.args || [];
    const cmd = `node "${join(REPO_ROOT, 'cli/index.js')}" ${testCase.template} ${args.join(' ')}`;
    execSync(cmd, { cwd: testWorkDir, stdio: 'pipe' });

    // Load generated manifest
    const manifestPath = join(testWorkDir, `.github/workflows/${testCase.template}.yml`);
    if (!existsSync(manifestPath)) {
      throw new Error(`Manifest not generated at ${manifestPath}`);
    }
    const manifestRaw = readFileSync(manifestPath, 'utf8');
    const manifest = yaml.load(manifestRaw);
    const generatedJob = manifest.jobs.release;

    // 1. Verify against Preset if specified
    if (testCase.matchPreset) {
      const examplesPath = join(REPO_ROOT, `examples/${testCase.template}.yml`);
      const presets = this.templateLoader.extractPresets(examplesPath);
      const targetPreset = presets.find(p => p.id === testCase.matchPreset || p.name === testCase.matchPreset);
      
      if (!targetPreset) {
        throw new Error(`Preset "${testCase.matchPreset}" not found in ${examplesPath}`);
      }

      this.compareValues(generatedJob.with || {}, targetPreset.values, 'inputs');
      this.compareValues(generatedJob.secrets || {}, targetPreset.secrets, 'secrets');
    }

    // 2. Verify Required inputs if specified
    if (testCase.verifyRequired) {
      const template = this.templateLoader.loadTemplates().find(t => t.id === testCase.template);
      const inputs = this.templateLoader.parseWorkflowInputs(template);
      
      for (const [name, config] of Object.entries(inputs)) {
        if (config.required && generatedJob.with?.[name] === undefined) {
          throw new Error(`Required input "${name}" missing from generated manifest`);
        }
      }
    }

    // 3. Verify manual contains if specified
    if (testCase.expect?.contains) {
      for (const str of testCase.expect.contains) {
        if (!manifestRaw.includes(str)) {
          throw new Error(`Manifest missing expected string: "${str}"`);
        }
      }
    }
  }

  compareValues(generated, expected, type) {
    for (const [key, val] of Object.entries(expected)) {
      if (generated[key] !== val) {
        throw new Error(`Mismatch in ${type} "${key}": expected "${val}", got "${generated[key]}"`);
      }
    }
  }
}

const runner = new UXTestRunner();
runner.run().catch(err => {
  console.error(err);
  process.exit(1);
});
