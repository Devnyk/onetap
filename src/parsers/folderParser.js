// Convert text tree into object representation
function parseFolderTree(tree) {
  const lines = tree.split("\n").map((l) => l.trim()).filter(Boolean);
  const root = { name: "root", children: [] };
  const stack = [root];

  for (const line of lines) {
    const depth = line.search(/\S/); // spaces = depth
    const name = line.replace(/^[├─└ ]+/, "").trim();
    const node = { name, children: [] };

    while (stack.length > depth + 1) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return root;
}

module.exports = { parseFolderTree };
