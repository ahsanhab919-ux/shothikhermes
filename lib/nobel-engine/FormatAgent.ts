/**
 * FormatAgent - TOON Format Converter
 * Internal optimization for AI prompts - 40-60% token savings
 * Users never interact with TOON directly
 */

export interface TOONOptions {
  preserveKeys?: boolean;
  compactArrays?: boolean;
}

export class FormatAgent {
  /**
   * Convert JSON/object to TOON format
   * Example: { users: [{id: 1, name: "Alice"}] }
   * → users[1]{id,name}:\n  1,Alice
   */
  static toTOON(data: any, options: TOONOptions = {}): string {
    if (Array.isArray(data)) {
      return this.arrayToTOON(data, options);
    }
    if (typeof data === 'object' && data !== null) {
      return this.objectToTOON(data, options);
    }
    return String(data);
  }

  private static objectToTOON(obj: Record<string, any>, options: TOONOptions): string {
    const lines: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && value.length > 0) {
        // Array format: key[count]{fields}:
        const firstItem = value[0];
        if (typeof firstItem === 'object') {
          const fields = Object.keys(firstItem).join(',');
          lines.push(`${key}[${value.length}]{${fields}}:`);
          // Values
          value.forEach((item: any) => {
            const vals = Object.values(item).map(v => this.escapeValue(v)).join(',');
            lines.push(`  ${vals}`);
          });
        } else {
          // Simple array
          lines.push(`${key}[${value.length}]:`);
          value.forEach((v: any) => lines.push(`  ${this.escapeValue(v)}`));
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested object
        lines.push(`${key}{`);
        lines.push(this.objectToTOON(value, options).split('\n').map(l => '  ' + l).join('\n'));
        lines.push(`}`);
      } else {
        // Simple key-value
        lines.push(`${key}:${this.escapeValue(value)}`);
      }
    }
    
    return lines.join('\n');
  }

  private static arrayToTOON(arr: any[], options: TOONOptions): string {
    if (arr.length === 0) return '[]';
    
    const firstItem = arr[0];
    if (typeof firstItem === 'object') {
      const fields = Object.keys(firstItem).join(',');
      const lines = [`[${arr.length}]{${fields}}:`];
      arr.forEach(item => {
        const vals = Object.values(item).map(v => this.escapeValue(v)).join(',');
        lines.push(`  ${vals}`);
      });
      return lines.join('\n');
    }
    
    return `[${arr.length}]:\n` + arr.map(v => `  ${this.escapeValue(v)}`).join('\n');
  }

  private static escapeValue(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape commas and newlines
    if (str.includes(',') || str.includes('\n') || str.includes(':')) {
      return `"${str.replace(/"/g, '\\"')}"`;
    }
    return str;
  }

  /**
   * Convert TOON back to JSON/object
   */
  static fromTOON(toonString: string): any {
    const lines = toonString.split('\n').filter(l => l.trim());
    return this.parseTOONLines(lines, 0).value;
  }

  private static parseTOONLines(lines: string[], startIdx: number): { value: any, endIdx: number } {
    const result: Record<string, any> = {};
    let i = startIdx;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Check for indented values (array items)
      if (line.startsWith('  ') || line.startsWith('\t')) {
        i++;
        continue;
      }
      
      // Array format: key[count]{fields}:
      const arrayMatch = line.match(/^(\w+)\[(\d+)\](?:\{([^}]+)\})?:$/);
      if (arrayMatch) {
        const [, key, count, fields] = arrayMatch;
        const items: any[] = [];
        i++;
        
        // Parse array items
        while (i < lines.length && (lines[i].startsWith('  ') || lines[i].startsWith('\t'))) {
          const itemLine = lines[i].trim();
          if (fields) {
            // Object array
            const fieldNames = fields.split(',');
            const values = this.parseCSVLine(itemLine);
            const item: Record<string, any> = {};
            fieldNames.forEach((f, idx) => {
              item[f] = values[idx] ?? '';
            });
            items.push(item);
          } else {
            // Simple array
            items.push(itemLine);
          }
          i++;
        }
        
        result[key] = items;
        continue;
      }
      
      // Simple key-value
      const kvMatch = line.match(/^(\w+):(.+)$/);
      if (kvMatch) {
        result[kvMatch[1]] = kvMatch[2].trim();
      }
      
      i++;
    }
    
    return { value: result, endIdx: i };
  }

  private static parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && line[i - 1] !== '\\') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  /**
   * Calculate token savings
   */
  static calculateSavings(jsonData: any): { json: number; toon: number; savings: number } {
    const jsonStr = JSON.stringify(jsonData);
    const toonStr = this.toTOON(jsonData);
    
    // Rough token estimation (1 token ≈ 4 chars for English)
    const jsonTokens = Math.ceil(jsonStr.length / 4);
    const toonTokens = Math.ceil(toonStr.length / 4);
    
    return {
      json: jsonTokens,
      toon: toonTokens,
      savings: Math.round(((jsonTokens - toonTokens) / jsonTokens) * 100)
    };
  }

  /**
   * Optimize AI context - main entry point
   */
  static optimizeForAI(context: Record<string, any>): {
    content: string;
    format: 'toon' | 'json';
    savings: number;
  } {
    const toonContent = this.toTOON(context);
    const stats = this.calculateSavings(context);
    
    return {
      content: toonContent,
      format: 'toon',
      savings: stats.savings
    };
  }
}

// Export singleton instance for convenience
export const formatAgent = new FormatAgent();
