# Reusable Workflows

A collection of reusable GitHub Actions workflows providing standardized CI/CD patterns.

## Scope

Workflows in this repository are:

- Designed to be consumed via `workflow_call`
- Self-contained and free of internal or proprietary dependencies
- Configurable through explicit inputs and secrets
- Suitable for use in public and private repositories

## Usage

Workflows are referenced directly from this repository:

```yaml
uses: udx/reusable-workflows/.github/workflows/<workflow>.yml@master
```

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/udx/reusable-workflows/blob/master/LICENSE) file for details.
