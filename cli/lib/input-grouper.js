/**
 * Groups workflow inputs by prefix pattern
 * Dynamically discovers prefixes from input descriptions (e.g., "Docker Hub:", "GCP:", "ACR:")
 * No hardcoded domain logic
 */
export class InputGrouper {
  constructor(config) {
    this.config = config;
  }

  groupInputsByPrefix(inputs) {
    const groups = { common: [] };
    const pattern = this.config.metadata.inputPrefixPattern;
    
    // First pass: discover unique prefixes
    for (const [name, config] of Object.entries(inputs)) {
      const desc = config.description || '';
      const match = desc.match(pattern);
      
      if (match) {
        const prefix = match[1].trim();
        const groupKey = prefix.toLowerCase().replace(/\s+/g, '-');
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
      }
    }
    
    // Second pass: assign inputs to groups
    for (const [name, config] of Object.entries(inputs)) {
      const desc = config.description || '';
      const match = desc.match(pattern);
      
      if (match) {
        const prefix = match[1].trim();
        const groupKey = prefix.toLowerCase().replace(/\s+/g, '-');
        groups[groupKey].push({ name, prefix, ...config });
      } else {
        groups.common.push({ name, ...config });
      }
    }
    
    return groups;
  }

  extractPrompt(description) {
    const pattern = this.config.metadata.inputPrefixPattern;
    let prompt = description;
    
    // Remove prefix if present
    const match = prompt.match(pattern);
    if (match) {
      prompt = prompt.substring(match[0].length).trim();
    }
    
    // Remove parenthetical notes
    return prompt.split('(')[0].trim();
  }
}
