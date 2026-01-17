import chalk from 'chalk';
import inquirer from 'inquirer';

/**
 * UI helpers for consistent visual presentation
 */
export class UI {
  constructor(config) {
    this.config = config;
  }

  printSectionHeader(icon, title) {
    const width = this.config.ui.boxWidth;
    const contentLength = 2 + icon.length + 1 + title.length + 1 + 1;
    const padding = ' '.repeat(Math.max(0, width - contentLength + 2));
    console.log('\n' + chalk.gray('═'.repeat(width)));
    console.log(chalk.gray('┃ ') + chalk.blue.bold(`${icon} ${title}`) + padding + chalk.gray('┃'));
    console.log(chalk.gray('═'.repeat(width)) + '\n');
  }

  printHeader() {
    const icons = this.config.ui.icons;
    console.log(chalk.blue.bold(`\n${icons.main} Reusable Workflows Generator`));
    console.log(chalk.gray('A tool to generate and update GitHub Actions manifests based on shared udx templates.'));
    console.log(chalk.gray('═'.repeat(this.config.ui.boxWidth)) + '\n');
  }

  printHelp() {
    const icons = this.config.ui.icons;
    console.log(chalk.blue.bold(`\n${icons.main} Reusable Workflows CLI Help`));
    console.log(chalk.gray('═'.repeat(this.config.ui.boxWidth)));
    console.log(`\nUsage:`);
    console.log(`  npx @udx/reusable-workflows [options]`);
    console.log(`\nOptions:`);
    console.log(`  -o, --output <path>    Custom output path or filename`);
    console.log(`  -r, --ref <branch/tag> Pin to specific version (default: master)`);
    console.log(`  -n, --non-interactive  Run without prompts (uses detected values/defaults)`);
    console.log(`  -h, --help             Show this help message`);
    console.log(`\nDescription:`);
    console.log(`  This CLI helps you integrate standard reusable workflows into your repository.`);
    console.log(`  It auto-detects existing configurations and minimizes manual setup.`);
    console.log(`\nFeatures:`);
    console.log(`  - Smart configuration detection`);
    console.log(`  - Real-time manifest preview`);
    console.log(`  - Opt-in setup documentation`);
    console.log('\n' + chalk.gray('═'.repeat(this.config.ui.boxWidth)) + '\n');
  }

  printFooter() {
    console.log('\n' + chalk.gray('═'.repeat(this.config.ui.boxWidth)) + '\n');
  }

  buildTemplateChoices(templates) {
    return templates.reduce((acc, t, index) => {
      acc.push({
        name: `${chalk.cyan(t.name)} ${chalk.gray('─')} ${t.description}`,
        value: t.id,
        short: t.name
      });
      if (index < templates.length - 1) {
        acc.push(new inquirer.Separator(chalk.gray('━'.repeat(this.config.ui.boxWidth))));
      }
      return acc;
    }, []);
  }
}
