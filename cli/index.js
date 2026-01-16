#!/usr/bin/env node

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';

import { CLI_CONFIG } from './config.js';
import { TemplateLoader } from './lib/template-loader.js';
import { InputGrouper } from './lib/input-grouper.js';
import { UI } from './lib/ui.js';
import { FileGenerator } from './lib/file-generator.js';
import { ConfigDetector } from './lib/config-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main workflow generator orchestrator
 * Coordinates template loading, input grouping, and user prompts
 */
class WorkflowGenerator {
  constructor() {
    this.config = CLI_CONFIG;
    
    // Support both local development and bundled npm package
    // Local: __dirname is /cli, templates are in ..
    // Bundled: templates are copied into /cli
    const bundledWorkflows = join(__dirname, this.config.components.workflow.dir);
    this.repoRoot = existsSync(bundledWorkflows) ? __dirname : join(__dirname, '..');
    
    // Initialize modules
    this.templateLoader = new TemplateLoader(this.repoRoot, this.config);
    this.inputGrouper = new InputGrouper(this.config);
    this.ui = new UI(this.config);
    this.fileGenerator = new FileGenerator(this.config);
    this.configDetector = new ConfigDetector();
    
    // Load templates
    this.templates = this.templateLoader.loadTemplates();
  }

  async run() {
    const args = process.argv.slice(2);
    const isHelp = args.includes('--help') || args.includes('-h');
    const isNonInteractive = args.includes('--non-interactive') || args.includes('-n');
    
    // Support positional template selection: reusable-workflows <template-id>
    const positionalTemplateId = args.find(arg => !arg.startsWith('-'));

    // Support custom output path: --output <path> or -o <path>
    const outputIdx = args.findIndex(arg => arg === '--output' || arg === '-o');
    const customOutputPath = outputIdx !== -1 ? args[outputIdx + 1] : null;

    // Support reference pinning: --ref <tag/branch> or -r <tag/branch>
    const refIdx = args.findIndex(arg => arg === '--ref' || arg === '-r');
    const cliRef = refIdx !== -1 ? args[refIdx + 1] : null;

    if (isHelp) {
      this.ui.printHelp();
      return;
    }

    const icons = this.config.ui.icons;
    
    // Header
    this.ui.printHeader();

    // Template selection
    let templateId = positionalTemplateId;
    if (!templateId) {
      const result = await inquirer.prompt([
        {
          type: 'list',
          name: 'templateId',
          message: 'Select workflow template:',
          pageSize: this.config.ui.pageSize,
          choices: this.ui.buildTemplateChoices(this.templates)
        }
      ]);
      templateId = result.templateId;
    }

    const template = this.templates.find(t => t.id === templateId);
    const inputs = this.templateLoader.parseWorkflowInputs(template);
    
    // Auto-detection phase
    const detectedValues = this.configDetector.detectExistingConfig(templateId);
    if (Object.keys(detectedValues).length > 0) {
      console.log(chalk.green(`\n✨ Auto-detected existing configuration from .github/workflows\n`));
    }
    // Configuration
    const groupedInputs = this.inputGrouper.groupInputsByPrefix(inputs);
    
    // Version / Ref selection
    let versionRef = cliRef;
    if (!versionRef && !isNonInteractive) {
      const { selectedRef } = await inquirer.prompt([
        {
          type: 'input',
          name: 'selectedRef',
          message: 'Workflow reference (branch/tag):',
          default: 'master'
        }
      ]);
      versionRef = selectedRef;
    } else if (!versionRef) {
      versionRef = 'master';
    }

    // Common inputs
    this.ui.printSectionHeader(icons.config, 'Configuration');
    const commonAnswers = await this.promptInputs(groupedInputs.common, detectedValues, isNonInteractive);

    // Optional component groups
    const prefixGroups = Object.keys(groupedInputs).filter(key => key !== 'common');
    let groupAnswers = {};
    let selectedGroups = [];
    
    if (prefixGroups.length > 0) {
      if (!isNonInteractive) {
        this.ui.printSectionHeader(icons.components, 'Optional Components');
        
        const result = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedGroups',
            message: 'Select components to configure:',
            choices: prefixGroups.map(key => ({
              name: groupedInputs[key][0].prefix,
              value: key,
              checked: selectedGroups.includes(key) || groupedInputs[key].some(input => detectedValues[input.name] !== undefined)
            }))
          }
        ]);
        
        selectedGroups = result.selectedGroups;
      } else {
        // In non-interactive mode, select groups that have detected inputs
        selectedGroups = prefixGroups.filter(key => 
          groupedInputs[key].some(input => detectedValues[input.name] !== undefined)
        );
      }

      for (const groupKey of selectedGroups) {
        const groupInputs = groupedInputs[groupKey];
        const groupName = groupInputs[0].prefix;
        
        if (!isNonInteractive) {
          this.ui.printSectionHeader(icons.group, `${groupName} Configuration`);
        }
        const answers = await this.promptInputs(groupInputs, detectedValues, isNonInteractive);
        groupAnswers = { ...groupAnswers, ...answers };
      }
    }

    const allAnswers = { ...commonAnswers, ...groupAnswers };

    // Preview and Confirmation
    if (!isNonInteractive) {
      this.ui.printSectionHeader(icons.complete, 'Preview Manifest');
      const manifestContent = this.fileGenerator.previewManifest(template, allAnswers);
      console.log(chalk.gray('---'));
      console.log(chalk.white(manifestContent));
      console.log(chalk.gray('---'));

      const { confirmAction, generateSetupDoc } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmAction',
          message: 'Proceed to generate/update workflow manifest?',
          default: true
        },
        {
          type: 'confirm',
          name: 'generateSetupDoc',
          message: 'Do you also need a setup guide (SETUP-*.md)?',
          default: false,
          when: (ans) => ans.confirmAction
        }
      ]);

      if (!confirmAction) {
        console.log(chalk.red('\n✗ Generation cancelled'));
        return { cancelled: true };
      }
      var finalGenerateSetup = generateSetupDoc;
    } else {
      console.log(chalk.green(`\n🚀 Non-interactive mode: applying detected/default values...`));
      var finalGenerateSetup = false; // Usually not needed in scripts
    }

    // Generate files
    const result = await this.fileGenerator.generateFiles(
      template,
      allAnswers,
      selectedGroups,
      finalGenerateSetup,
      customOutputPath,
      versionRef
    );

    if (result.cancelled) {
      return { cancelled: true };
    }

    // Results
    this.ui.printSectionHeader(icons.complete, 'Generation Complete');
    console.log(chalk.green('✓ Generated: ') + chalk.white(result.workflowFile));
    console.log(chalk.green('✓ Generated: ') + chalk.white(result.setupFile));
    
    this.ui.printSectionHeader(icons.steps, 'Next Steps');
    console.log(chalk.white('  1. Review ') + chalk.cyan(result.workflowFile));
    console.log(chalk.white('  2. Follow ') + chalk.cyan(result.setupFile) + chalk.white(' to configure GitHub secrets'));
    console.log(chalk.white('  3. Commit and push to trigger workflow'));
    
    this.ui.printFooter();

    return { templateId, answers: allAnswers, files: result };
  }

  async promptInputs(inputs, detectedValues = {}, isNonInteractive = false) {
    if (!inputs || inputs.length === 0) {
      return {};
    }
    
    // In non-interactive mode, we skip all prompts and use detected/default values
    if (isNonInteractive) {
      const fallbackAnswers = {};
      inputs.forEach(input => {
        if (detectedValues[input.name] === undefined) {
          fallbackAnswers[input.name] = input.default || '';
        }
      });
      return { ...detectedValues, ...fallbackAnswers };
    }
    
    const questions = inputs
      .filter(input => detectedValues[input.name] === undefined)
      .map(input => {
        const question = {
          type: 'input',
          name: input.name,
          message: this.inputGrouper.extractPrompt(input.description),
          default: input.default || ''
        };
        
        if (input.required) {
          question.validate = (val) => {
            if (val && val.length > 0) return true;
            return 'This field is required';
          };
        }
        
        return question;
      });

    const answers = await inquirer.prompt(questions);
    
    // Merge detected values back in
    return { ...detectedValues, ...answers };
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  try {
    const generator = new WorkflowGenerator();
    await generator.run();
  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('Prompt couldn\'t be rendered in the current environment'));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(1);
  }
}

main();
