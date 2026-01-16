import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import yaml from 'js-yaml';
import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Generates workflow manifest and setup documentation
 */
export class FileGenerator {
  constructor(config) {
    this.config = config;
  }

  async generateFiles(template, answers, selectedGroups = [], generateSetup = false, customOutputPath = null, ref = 'master') {
    const workflowDir = join(process.cwd(), '.github/workflows');
    const workflowFile = customOutputPath 
      ? (customOutputPath.endsWith('.yml') || customOutputPath.endsWith('.yaml') ? customOutputPath : join(customOutputPath, `${template.id}.yml`))
      : join(workflowDir, `${template.id}.yml`);
    const setupFile = join(process.cwd(), `SETUP-${template.id}.md`);

    // Ensure destination directory exists
    const finalDir = dirname(workflowFile);
    if (!existsSync(finalDir)) {
      mkdirSync(finalDir, { recursive: true });
    }

    // Generate workflow manifest
    const workflowContent = this.generateWorkflowManifest(template, answers, ref);
    writeFileSync(workflowFile, workflowContent, 'utf8');

    // Generate setup documentation only if requested
    if (generateSetup) {
      const setupContent = this.generateSetupDoc(template, answers, selectedGroups);
      writeFileSync(setupFile, setupContent, 'utf8');
    }

    return {
      workflowFile,
      setupFile: generateSetup ? setupFile : null,
      cancelled: false
    };
  }

  previewManifest(template, answers, ref = 'master') {
    return this.generateWorkflowManifest(template, answers, ref);
  }

  generateWorkflowManifest(template, answers, ref = 'master') {
    // Read example file as base
    const exampleContent = readFileSync(template.examplesPath, 'utf8');
    const example = yaml.load(exampleContent);

    // Find the job that uses the reusable workflow
    let workflowJob = null;
    for (const [jobName, jobConfig] of Object.entries(example.jobs || {})) {
      if (jobConfig.uses) {
        workflowJob = jobConfig;
        break;
      }
    }

    // Update the 'uses' reference
    if (workflowJob.uses) {
      const base = workflowJob.uses.split('@')[0];
      workflowJob.uses = `${base}@${ref}`;
    }

    // Update the 'with' section with user answers and detected values
    if (!workflowJob.with) {
      workflowJob.with = {};
    }
    
    // Merge answers into the existing 'with' section
    for (const [key, value] of Object.entries(answers)) {
      if (value !== undefined) {
        workflowJob.with[key] = value;
      }
    }

    // Generate the manifest
    return yaml.dump(example, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false
    });
  }

  generateSetupDoc(template, answers, selectedGroups) {
    const docsContent = readFileSync(template.docsPath, 'utf8');
    
    let setup = `# Setup Guide: ${template.name}\n\n`;
    setup += `This guide will help you configure the workflow in your repository.\n\n`;
    
    setup += `## 1. Workflow File\n\n`;
    setup += `The workflow manifest has been generated at:\n`;
    setup += `\`\`\`\n.github/workflows/${template.id}.yml\n\`\`\`\n\n`;
    
    setup += `## 2. Configuration Summary\n\n`;
    setup += `Your configuration:\n\n`;
    for (const [key, value] of Object.entries(answers)) {
      setup += `- **${key}**: \`${value}\`\n`;
    }
    setup += `\n`;
    
    if (selectedGroups.length > 0) {
      setup += `## 3. Selected Components\n\n`;
      setup += `You have enabled the following optional components:\n\n`;
      selectedGroups.forEach(group => {
        setup += `- ${group}\n`;
      });
      setup += `\n`;
    }
    
    setup += `## ${selectedGroups.length > 0 ? '4' : '3'}. GitHub Secrets & Variables\n\n`;
    setup += `Configure the following in your repository settings:\n\n`;
    setup += `**Settings → Secrets and variables → Actions**\n\n`;
    
    // Extract secrets/vars from docs
    const secretsSection = this.extractSecretsFromDocs(docsContent);
    if (secretsSection) {
      setup += secretsSection + '\n';
    }
    
    setup += `## ${selectedGroups.length > 0 ? '5' : '4'}. Permissions\n\n`;
    setup += `Ensure your workflow has the required permissions:\n\n`;
    
    const permissionsSection = this.extractPermissionsFromDocs(docsContent);
    if (permissionsSection) {
      setup += permissionsSection + '\n';
    }
    
    setup += `## ${selectedGroups.length > 0 ? '6' : '5'}. Complete Documentation\n\n`;
    setup += `For detailed information, see: [\`docs/${template.id}.md\`](docs/${template.id}.md)\n`;
    
    return setup;
  }

  extractSecretsFromDocs(docsContent) {
    // Look for secrets/configuration section
    const lines = docsContent.split('\n');
    let inSecretsSection = false;
    let secretsContent = '';
    
    for (const line of lines) {
      if (line.match(/^##\s+(Secrets|Configuration|Inputs)/i)) {
        inSecretsSection = true;
        continue;
      }
      if (inSecretsSection && line.match(/^##\s+/)) {
        break;
      }
      if (inSecretsSection) {
        secretsContent += line + '\n';
      }
    }
    
    return secretsContent.trim() || 'See documentation for required secrets and variables.';
  }

  extractPermissionsFromDocs(docsContent) {
    // Look for permissions section
    const lines = docsContent.split('\n');
    let inPermissionsSection = false;
    let permissionsContent = '';
    
    for (const line of lines) {
      if (line.match(/^##\s+Permissions/i)) {
        inPermissionsSection = true;
        continue;
      }
      if (inPermissionsSection && line.match(/^##\s+/)) {
        break;
      }
      if (inPermissionsSection) {
        permissionsContent += line + '\n';
      }
    }
    
    return permissionsContent.trim() || 'See documentation for required permissions.';
  }
}
