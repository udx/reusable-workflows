import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';

/**
 * Loads and validates workflow templates
 * Each template MUST have all 3 components: workflow.yml + docs.md + example.yml
 */
export class TemplateLoader {
  constructor(repoRoot, config) {
    this.repoRoot = repoRoot;
    this.config = config;
  }

  loadTemplates() {
    const workflowsDir = join(this.repoRoot, this.config.components.workflow.dir);
    const docsDir = join(this.repoRoot, this.config.components.docs.dir);
    const examplesDir = join(this.repoRoot, this.config.components.example.dir);

    if (!existsSync(workflowsDir)) {
      throw new Error(`Workflows directory not found: ${workflowsDir}`);
    }

    const workflowFiles = readdirSync(workflowsDir)
      .filter(file => file.endsWith(this.config.components.workflow.ext))
      .filter(file => !file.startsWith('_'));

    const templates = [];

    for (const file of workflowFiles) {
      const templateId = basename(file, this.config.components.workflow.ext);
      const workflowPath = join(workflowsDir, file);
      const docsPath = join(docsDir, `${templateId}${this.config.components.docs.ext}`);
      const examplesPath = join(examplesDir, `${templateId}${this.config.components.example.ext}`);

      // Validate: All 3 components must exist
      if (!existsSync(docsPath)) {
        console.warn(chalk.yellow(`⚠ Skipping ${templateId}: missing ${this.config.components.docs.dir}/${templateId}${this.config.components.docs.ext}`));
        continue;
      }
      if (!existsSync(examplesPath)) {
        console.warn(chalk.yellow(`⚠ Skipping ${templateId}: missing ${this.config.components.example.dir}/${templateId}${this.config.components.example.ext}`));
        continue;
      }

      try {
        const workflowContent = readFileSync(workflowPath, 'utf8');
        const workflow = yaml.load(workflowContent);

        if (workflow.on && workflow.on.workflow_call) {
          const name = workflow.name || templateId;
          const description = this.extractDocsDescription(docsPath);

          templates.push({
            id: templateId,
            name,
            description,
            workflowPath,
            docsPath,
            examplesPath,
            presets: this.extractPresets(examplesPath),
            defaultTriggers: this.extractExampleTriggers(examplesPath)
          });
        }
      } catch (error) {
        console.warn(chalk.yellow(`⚠ Could not parse ${file}: ${error.message}`));
      }
    }

    if (templates.length === 0) {
      throw new Error('No valid templates found. Each template requires: workflow.yml + docs.md + example.yml');
    }

    return templates;
  }

  extractDocsDescription(docsPath) {
    try {
      const content = readFileSync(docsPath, 'utf8');
      const match = content.match(this.config.metadata.docsShortDescription);
      if (match) {
        return match[1].trim();
      }
      
      // Fallback: first non-header line
      const lines = content.split('\n');
      let foundTitle = false;
      for (const line of lines) {
        if (line.startsWith('# ')) {
          foundTitle = true;
          continue;
        }
        if (foundTitle && line.trim() && !line.startsWith('#') && !line.startsWith('```') && !line.startsWith('<!--')) {
          const desc = line.trim();
          return desc.length > 60 ? desc.substring(0, 57) + '...' : desc;
        }
      }
    } catch (error) {
      // Ignore
    }
    return 'Reusable workflow template';
  }

  parseWorkflowInputs(template) {
    const content = readFileSync(template.workflowPath, 'utf8');
    const workflow = yaml.load(content);
    return workflow.on.workflow_call.inputs || {};
  }

  parseWorkflowSecrets(template) {
    const content = readFileSync(template.workflowPath, 'utf8');
    const workflow = yaml.load(content);
    return workflow.on.workflow_call.secrets || {};
  }

  extractPresets(examplesPath) {
    const presets = [];
    try {
      const templateId = examplesPath.split('/').pop().replace('.yml', '');
      const content = readFileSync(examplesPath, 'utf8');
      
      // 1. Create a "normalized" version of the file where structural comments are stripped
      // but purely descriptive comments are kept to maintain YAML validity.
      const lines = content.split('\n');
      const normalizedLines = lines.map(line => {
        // Only strip the leading '#' if it's followed by something that looks like YAML structure
        // (key: value, - list item, or block start)
        if (line.match(/^(\s*)#\s*([\w-]+):/) || line.match(/^(\s*)#\s*- /)) {
          return line.replace(/^(\s*)#\s?/, '$1');
        }
        return line;
      });

      // 2. Scan normalized lines for template usage
      for (let i = 0; i < normalizedLines.length; i++) {
        const line = normalizedLines[i];
        if (line.includes(`${templateId}.yml@`)) {
          // Backtrack to find job ID (nearest line with LESS indentation)
          let jobId = null;
          let jobStartIndex = -1;
          let jobIndent = -1;
          const currentIndent = line.match(/^(\s*)/)[0].length;

          for (let j = i - 1; j >= 0; j--) {
            const prevLine = normalizedLines[j];
            const match = prevLine.match(/^(\s*)([\w-]+):\s*$/);
            if (match) {
              const prevIndent = match[1].length;
              if (prevIndent < currentIndent) {
                jobId = match[2];
                jobIndent = prevIndent;
                jobStartIndex = j;
                break;
              }
            }
            // Stop if we hit unindented prose and it's not a comment-turned-line
            if (prevLine.trim() !== '' && !prevLine.match(/^\s/) && !lines[j].startsWith('#')) break;
          }

          if (jobId) {
            // Collect block lines
            const blockLines = [normalizedLines[jobStartIndex]];
            for (let k = jobStartIndex + 1; k < normalizedLines.length; k++) {
              const nextLine = normalizedLines[k];
              if (nextLine.trim() === '') {
                blockLines.push('');
                continue;
              }
              const nextIndent = nextLine.match(/^(\s*)/)[1].length;
              if (nextIndent > jobIndent) {
                blockLines.push(nextLine);
              } else {
                break;
              }
            }

            // Parse block
            try {
              const blockContent = blockLines.join('\n');
              const data = yaml.load(blockContent);
              const job = data[jobId];
              if (job && job.uses && job.uses.includes(templateId)) {
                presets.push({
                  id: jobId,
                  name: this.formatPresetName(jobId),
                  values: job.with || {},
                  secrets: job.secrets || {}
                });
              }
            } catch (e) { /* skip invalid blocks */ }
          }
        }
      }
    } catch (e) { /* ignore file errors */ }
    
    // Deduplicate by name
    return presets.filter((p, index, self) => 
      index === self.findIndex((t) => t.name === p.name)
    );
  }

  formatPresetName(jobId) {
    const acronyms = ['GCR', 'ACR', 'GCP', 'SBOM'];
    return jobId
      .split(/[-_]/)
      .map(word => {
        const upper = word.toUpperCase();
        if (acronyms.includes(upper)) return upper;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  extractExampleTriggers(examplesPath) {
    try {
      const content = readFileSync(examplesPath, 'utf8');
      const data = yaml.load(content);
      if (data.on) {
        return data.on;
      }
    } catch (e) {
      // Ignore
    }
    return { push: { branches: ['main'] }, workflow_dispatch: null };
  }
}
