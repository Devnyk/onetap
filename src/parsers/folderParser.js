// utils/folderTreeParser.js

/**
 * Enhanced folder tree parser with better validation and content detection
 * - Removes emojis 📁 📄
 * - Handles ├──, │, └──, ─
 * - Validates nesting
 * - Detects if files might have content based on extensions
 */
export function parseFolderTree(input) {
  const lines = input
    .split("\n")
    .map(line => line.replace(/\r$/, "")) // Windows endings
    .map(line => line.replace(/[📁📄🔧⚙️🛠️💼📋🎨]/g, "")) // strip common emojis
    .filter(Boolean);

  const root = [];
  const stack = [{ level: -1, children: root, type: "folder", name: "<root>" }];

  for (let rawLine of lines) {
    // 1. Count indent level
    const indentMatch = rawLine.match(/^[\s│]+/);
    const indentLevel = indentMatch
      ? indentMatch[0].replace(/│/g, "  ").length / 2
      : 0;

    // 2. Clean tree symbols
    let clean = rawLine.replace(/^[\s│├└─]+/, "").trim();
    if (!clean) continue;

    // 3. Remove inline comments and descriptions
    clean = clean.replace(/\s*(#|\/\/|--|\(.*\)).*$/, "").trim();
    if (!clean) continue;

    // 4. Determine if folder or file
    const isFolder = clean.endsWith("/") || 
                    !clean.includes(".") || 
                    isKnownFolder(clean);

    // 5. Check if this might be a content-rich file
    const mightHaveContent = !isFolder && hasImportantExtension(clean);

    const node = {
      name: clean.replace(/\/$/, ""),
      type: isFolder ? "folder" : "file",
      children: [],
      mightHaveContent, // Flag for smart merger
      originalLine: rawLine.trim() // Keep original for debugging
    };

    // 6. Fix stack for proper nesting
    while (stack.length && stack[stack.length - 1].level >= indentLevel) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (!parent) {
      console.warn(`⚠️ Invalid indentation detected: "${rawLine}"`);
      continue; // Skip instead of throwing
    }
    
    if (parent.type === "file") {
      console.warn(`⚠️ Cannot add child to file: "${parent.name}" -> "${node.name}"`);
      continue; // Skip instead of throwing
    }

    parent.children.push(node);

    if (isFolder) {
      stack.push({ 
        level: indentLevel, 
        children: node.children, 
        type: "folder", 
        name: node.name 
      });
    }
  }

  return root;
}

/**
 * Check if a name is a known folder (even without trailing slash)
 */
export function isKnownFolder(name) {
  const knownFolders = [
    'src', 'public', 'dist', 'build', 'assets', 'components', 'pages', 
    'utils', 'lib', 'styles', 'images', 'fonts', 'scripts', 'config',
    'tests', 'test', '__tests__', 'docs', 'documentation', 'examples',
    'node_modules', '.git', '.vscode', 'coverage', 'cypress', 'e2e'
  ];
  return knownFolders.includes(name.toLowerCase());
}

/**
 * Check if file extension suggests it might contain important content
 */
export function hasImportantExtension(filename) {
  const importantExtensions = [
    '.js', '.ts', '.tsx', '.jsx', '.vue', '.svelte',
    '.json', '.config.js', '.config.ts', 
    '.css', '.scss', '.sass', '.less',
    '.html', '.htm', '.php', '.py', '.java', '.go', '.rs',
    '.md', '.txt', '.yml', '.yaml', '.toml',
    '.env', '.gitignore', '.gitattributes',
    '.dockerfile', 'dockerfile',
    '.sql', '.prisma', '.graphql'
  ];
  
  const ext = filename.toLowerCase();
  return importantExtensions.some(important => 
    ext.endsWith(important) || ext.includes(important)
  );
}

/**
 * Validate the parsed structure for common issues
 */
export function validateStructure(tree) {
  const issues = [];
  
  function traverse(nodes, path = "") {
    for (const node of nodes) {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      // Check for duplicate names at same level
      const siblings = nodes.filter(n => n.name === node.name);
      if (siblings.length > 1) {
        issues.push(`Duplicate name "${node.name}" at path: ${path}`);
      }
      
      // Check for invalid characters
      if (/[<>:"|?*]/.test(node.name)) {
        issues.push(`Invalid characters in name "${node.name}" at: ${currentPath}`);
      }
      
      if (node.type === "folder" && node.children.length > 0) {
        traverse(node.children, currentPath);
      }
    }
  }
  
  traverse(tree);
  return issues;
}
