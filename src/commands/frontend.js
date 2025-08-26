const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");

const setupFrontend = async (projectName) => {
  const spinner = ora();

  try {
    console.log(chalk.cyan(`\n🚀 Setting up Frontend project: ${projectName}\n`));

    // Check if directory already exists
    if (fs.existsSync(projectName)) {
      console.log(chalk.red(`❌ Directory "${projectName}" already exists!`));
      return;
    }

    // Step 1: Create React + Vite project
    spinner.start(chalk.blue("Creating React + Vite project..."));
    execSync(`npm create vite@latest ${projectName} -- --template react`, {
      stdio: "pipe",
      cwd: process.cwd(),
    });
    spinner.succeed(chalk.green("✅ React + Vite project created"));

    const projectPath = path.join(process.cwd(), projectName);

    // Step 2: Install dependencies
    spinner.start(chalk.blue("Installing dependencies..."));
    execSync("npm install", {
      stdio: "pipe",
      cwd: projectPath,
    });
    spinner.succeed(chalk.green("✅ Dependencies installed"));

    // Step 3: Install Tailwind CSS v4 + Vite plugin
    spinner.start(chalk.blue("Installing Tailwind CSS v4 + Vite plugin..."));
    execSync("npm install tailwindcss @tailwindcss/vite", {
      stdio: "pipe",
      cwd: projectPath,
    });
    spinner.succeed(chalk.green("✅ Tailwind CSS v4 installed"));

    // Step 4: Configure Tailwind entrypoint (index.css)
    spinner.start(chalk.blue("Configuring Tailwind CSS v4..."));

    const indexCSS = `@import "tailwindcss";
/* Your custom styles here */
`;
    fs.writeFileSync(path.join(projectPath, "src", "index.css"), indexCSS);

    // Delete App.css (not needed anymore)
    const appCssPath = path.join(projectPath, "src", "App.css");
    if (fs.existsSync(appCssPath)) fs.removeSync(appCssPath);

    spinner.succeed(chalk.green("✅ Tailwind CSS v4 configured"));

    // Step 5: Update vite.config.js to use Tailwind plugin
    spinner.start(chalk.blue("Updating vite.config.js..."));
    const viteConfigPath = path.join(projectPath, "vite.config.js");

    if (fs.existsSync(viteConfigPath)) {
      let viteConfig = fs.readFileSync(viteConfigPath, "utf-8");

      // Ensure React plugin is imported, then add Tailwind
      if (!viteConfig.includes('@tailwindcss/vite')) {
        viteConfig = viteConfig.replace(
          /import react.*\n/,
          (match) => `${match}import tailwindcss from '@tailwindcss/vite'\n`
        );
      }

      // Add tailwindcss() to plugins
      if (!viteConfig.includes("tailwindcss()")) {
        viteConfig = viteConfig.replace(
          /plugins:\s*\[/,
          "plugins: [\n    tailwindcss(),"
        );
      }

      fs.writeFileSync(viteConfigPath, viteConfig);
    }
    spinner.succeed(chalk.green("✅ vite.config.js updated"));

    // Step 6: Create clean App.jsx
    spinner.start(chalk.blue("Setting up clean App.jsx..."));

    const cleanAppJSX = `import { useState } from 'react'
import './index.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🚀 OneTap Frontend (Tailwind v4)
        </h1>
        <button
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition mb-4"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        <p className="text-gray-600">
          Edit <code className="bg-gray-100 px-2 py-1 rounded text-sm">src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App`;
    fs.writeFileSync(path.join(projectPath, "src", "App.jsx"), cleanAppJSX);

    spinner.succeed(chalk.green("✅ Clean App.jsx created"));

    // Step 7: Update package.json scripts
    spinner.start(chalk.blue("Updating package.json..."));
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson = fs.readJsonSync(packageJsonPath);

    packageJson.scripts = {
      ...packageJson.scripts,
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    };

    fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    spinner.succeed(chalk.green("✅ package.json updated"));

    // Final success message
    console.log(chalk.green("\n🎉 Frontend project setup completed successfully!\n"));
    console.log(chalk.cyan("📁 Project created at:"), chalk.white(projectPath));
    console.log(chalk.cyan("🚀 To get started:\n"));
    console.log(chalk.white(`   cd ${projectName}`));
    console.log(chalk.white("   npm run dev\n"));
    console.log(chalk.yellow("✨ Features included:"));
    console.log(chalk.white("   • React 18 with Vite"));
    console.log(chalk.white("   • Tailwind CSS v4 with @tailwindcss/vite plugin"));
    console.log(chalk.white("   • Clean starter template with HMR\n"));
  } catch (error) {
    spinner.fail(chalk.red("❌ Frontend setup failed"));
    console.error(chalk.red("Error details:"), error.message);

    if (fs.existsSync(projectName)) {
      console.log(chalk.yellow("🧹 Cleaning up..."));
      fs.removeSync(projectName);
    }
    throw error;
  }
};

module.exports = { setupFrontend };
