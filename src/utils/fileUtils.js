const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

/**
 * Enhanced file utilities for better content management
 */
class FileUtils {
  
  /**
   * Check if a file exists and has meaningful content
   */
  static async hasContent(filePath) {
    try {
      if (!await fs.pathExists(filePath)) return false;
      
      const stats = await fs.stat(filePath);
      if (stats.size === 0) return false;
      
      const content = await fs.readFile(filePath, 'utf8');
      return this.isContentMeaningful(content);
    } catch (error) {
      return false;
    }
  }

  /**
   * Determine if content is meaningful (not just whitespace/basic comments)
   */
  static isContentMeaningful(content) {
    if (!content || typeof content !== 'string') return false;
    
    const trimmed = content.trim();
    if (!trimmed) return false;
    
    // Remove common empty patterns
    const withoutComments = trimmed
      .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
      .replace(/\/\/.*$/gm, '')         // Line comments  
      .replace(/^\s*#.*$/gm, '')        // Shell/Python comments
      .replace(/<!--[\s\S]*?-->/g, '')  // HTML comments
      .trim();
    
    // Check if anything meaningful remains
    if (!withoutComments) return false;
    
    // Check for common empty patterns
    const emptyPatterns = [
      /^\{\s*\}$/,           // Empty object
      /^\[\s*\]$/,           // Empty array
      /^export\s+default\s+\{\s*\}$/,  // Empty export
      /^module\.exports\s*=\s*\{\s*\}$/  // Empty module
    ];
    
    return !emptyPatterns.some(pattern => pattern.test(withoutComments));
  }

  /**
   * Get file size in human readable format
   */
  static async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const bytes = stats.size;
      
      if (bytes === 0) return '0 B';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Backup existing file before modification
   */
  static async backupFile(filePath) {
    if (!await fs.pathExists(filePath)) return null;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    
    try {
      await fs.copy(filePath, backupPath);
      return backupPath;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Could not create backup for ${filePath}`));
      return null;
    }
  }

  /**
   * Check if path is safe to modify
   */
  static isSafePath(targetPath, baseDir) {
    const resolved = path.resolve(targetPath);
    const resolvedBase = path.resolve(baseDir);
    
    // Must be within base directory
    if (!resolved.startsWith(resolvedBase)) {
      return false;
    }
    
    // Check against dangerous paths
    const dangerous = [
      'node_modules',
      '.git',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ];
    
    const relativePath = path.relative(resolvedBase, resolved);
    return !dangerous.some(danger => 
      relativePath.startsWith(danger) || 
      relativePath.includes(`/${danger}/`) ||
      relativePath.endsWith(`/${danger}`)
    );
  }

  /**
   * Get appropriate file permissions for different file types
   */
  static getFilePermissions(filename) {
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename).toLowerCase();
    
    // Executable files
    if (['.sh', '.bat', '.cmd'].includes(ext) || 
        ['start', 'run', 'build'].includes(basename)) {
      return 0o755; // rwxr-xr-x
    }
    
    // Regular files
    return 0o644; // rw-r--r--
  }

  /**
   * Validate filename for cross-platform compatibility
   */
  static validateFilename(filename) {
    const issues = [];
    
    // Reserved names on Windows
    const reserved = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];
    
    if (reserved.includes(filename.toUpperCase())) {
      issues.push('Reserved filename on Windows');
    }
    
    // Invalid characters
    if (/[<>:"|?*\x00-\x1F]/.test(filename)) {
      issues.push('Contains invalid characters');
    }
    
    // Length check
    if (filename.length > 255) {
      issues.push('Filename too long (max 255 characters)');
    }
    
    // Starts/ends with space or dot
    if (/^[\s.]|[\s.]$/.test(filename)) {
      issues.push('Cannot start or end with space or dot');
    }
    
    return issues;
  }

  /**
   * Create safe filename by sanitizing input
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"|?*\x00-\x1F]/g, '_')  // Replace invalid chars
      .replace(/^[\s.]+|[\s.]+$/g, '')      // Trim spaces and dots
      .substring(0, 255);                   // Limit length
  }

  /**
   * Get file type category for better handling
   */
  static getFileCategory(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    const categories = {
      config: ['.json', '.js', '.ts', '.yml', '.yaml', '.toml', '.ini'],
      source: ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.py', '.java'],
      style: ['.css', '.scss', '.sass', '.less', '.styl'],
      markup: ['.html', '.htm', '.xml', '.svg'],
      doc: ['.md', '.txt', '.rst', '.adoc'],
      data: ['.json', '.csv', '.xml', '.sql'],
      image: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'],
      font: ['.woff', '.woff2', '.ttf', '.otf', '.eot']
    };
    
    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(ext)) return category;
    }
    
    return 'other';
  }
}

module.exports = { FileUtils };