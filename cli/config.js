// ============================================================================
// CLI CONFIGURATION - Adjust these as needed
// ============================================================================

export const CLI_CONFIG = {
  // Template components - each template MUST have all 3
  components: {
    workflow: { dir: '.github/workflows', ext: '.yml' },
    docs:     { dir: 'docs',              ext: '.md'  },
    example:  { dir: 'examples',          ext: '.yml' }
  },
  
  // Metadata extraction patterns
  metadata: {
    // Extract short description from docs: <!-- short: description -->
    docsShortDescription: /<!--\s*short:\s*(.+?)\s*-->/,
    
    // Extract presets from examples: ## PRESET: Name
    presetPattern: /##\s*PRESET:\s*(.+)/,
    
    // Group inputs by prefix pattern: "Prefix: Description"
    inputPrefixPattern: /^([A-Z][A-Za-z\s]+):\s/,
    
    // Variable/secret patterns in examples
    variablePattern: /\$\{\{\s*vars\.(\w+)\s*\}\}/,
    secretPattern: /\$\{\{\s*secrets\.(\w+)\s*\}\}/
  },
  
  // UI configuration
  ui: {
    boxWidth: 50,
    pageSize: 15,
    icons: {
      main: '🚀',
      config: '📝',
      components: '📦',
      group: '🔧',
      complete: '✓',
      steps: '📋'
    }
  }
};
