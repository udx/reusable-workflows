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
      .filter(file => file.endsWith(this.config.components.workflow.ext));

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
            examplesPath
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
}
