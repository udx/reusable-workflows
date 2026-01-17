import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

/**
 * Scans the current repository for existing reuseable workflow usages
 * to auto-detect configuration values and pre-fill answers.
 */
export class ConfigDetector {
  constructor() {
    this.workflowDir = join(process.cwd(), '.github/workflows');
  }

  /**
   * Scans for a specific template usage in the current repository
   * @param {string} templateId - The ID of the template (e.g., 'docker-ops')
   * @returns {Object} - Detected configuration values
   */
  detectExistingConfig(templateId) {
    if (!existsSync(this.workflowDir)) {
      return {};
    }

    const detectedConfig = {};
    const files = readdirSync(this.workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

    for (const file of files) {
      try {
        const content = readFileSync(join(this.workflowDir, file), 'utf8');
        const manifest = yaml.load(content);

        // Scan all jobs in the manifest
        for (const jobConfig of Object.values(manifest.jobs || {})) {
          if (jobConfig.uses && jobConfig.uses.includes(`${templateId}.yml`)) {
            // Found usage of this template
            if (jobConfig.with) {
              Object.assign(detectedConfig, jobConfig.with);
            }
            // We also want to capture which secrets are used, though they are usually patterns like ${{ secrets.X }}
            // but we can at least show what was there.
            break; 
          }
        }
      } catch (e) {
        // Skip unparseable files
      }
    }

    return detectedConfig;
  }
}
