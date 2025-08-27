const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

const setupBackend = async (projectName) => {
  const spinner = ora();
  
  try {
    console.log(chalk.cyan(`\n🚀 Setting up Backend project: ${projectName}\n`));

    // Check if directory already exists
    if (fs.existsSync(projectName)) {
      console.log(chalk.red(`❌ Directory "${projectName}" already exists!`));
      return;
    }

    const projectPath = path.join(process.cwd(), projectName);

    // Step 1: Create project directory
    spinner.start(chalk.blue('Creating project structure...'));
    fs.mkdirSync(projectPath);
    
    // Create folder structure
    const folders = [
      'db',
      'routes',
      'models',
      'middleware',
      'controllers',
      'utils'
    ];
    
    folders.forEach(folder => {
      fs.mkdirSync(path.join(projectPath, folder));
      // Create .gitkeep for empty folders
      if (['models', 'middleware', 'controllers', 'utils'].includes(folder)) {
        fs.writeFileSync(path.join(projectPath, folder, '.gitkeep'), '');
      }
    });
    
    spinner.succeed(chalk.green('✅ Project structure created'));

    // Step 2: Initialize npm and install dependencies
    spinner.start(chalk.blue('Initializing npm project...'));
    
    // Create package.json
    const packageJson = {
      "name": projectName,
      "version": "1.0.0",
      "description": "Backend API built with Node.js, Express, and MongoDB",
      "main": "server.js",
      "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js",
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "keywords": ["nodejs", "express", "mongodb", "api", "backend"],
      "author": "",
      "license": "ISC",
      "dependencies": {
        "express": "^4.18.2",
        "mongoose": "^7.6.3",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "helmet": "^7.1.0",
        "morgan": "^1.10.0"
      },
      "devDependencies": {
        "nodemon": "^3.0.1"
      }
    };
    
    fs.writeJsonSync(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
    spinner.succeed(chalk.green('✅ package.json created'));

    // Step 3: Install dependencies
    spinner.start(chalk.blue('Installing dependencies...'));
    execSync('npm install', {
      stdio: 'pipe',
      cwd: projectPath
    });
    spinner.succeed(chalk.green('✅ Dependencies installed'));

    // Step 4: Create server.js
    spinner.start(chalk.blue('Creating server.js...'));
    
    const serverJS = `const app = require('./app');
const connectDB = require('./db/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server is running on port \${PORT}\`);
  console.log(\`📡 API endpoint: http://localhost:\${PORT}\`);
});`;
    
    fs.writeFileSync(path.join(projectPath, 'server.js'), serverJS);
    spinner.succeed(chalk.green('✅ server.js created'));

    // Step 5: Create app.js
    spinner.start(chalk.blue('Creating app.js...'));
    
    const appJS = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api', require('./routes'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend API is running!',
    status: 'success',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/',
      api: '/api'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    status: 'error',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    status: 'error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;`;
    
    fs.writeFileSync(path.join(projectPath, 'app.js'), appJS);
    spinner.succeed(chalk.green('✅ app.js created'));

    // Step 6: Create database connection
    spinner.start(chalk.blue('Creating database configuration...'));
    
    const dbJS = `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/${projectName}';
    
    const conn = await mongoose.connect(mongoURI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    console.log(\`📊 MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;`;
    
    fs.writeFileSync(path.join(projectPath, 'db', 'db.js'), dbJS);
    spinner.succeed(chalk.green('✅ Database configuration created'));

    // Step 7: Create basic routes
    spinner.start(chalk.blue('Creating routes...'));
    
    const routesJS = `const express = require('express');
const router = express.Router();

// Welcome route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ${projectName} API',
    status: 'success',
    version: '1.0.0',
    endpoints: [
      'GET /api - This welcome message',
      'GET /api/health - Health check'
    ]
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Example route - Remove this and add your own routes
router.get('/example', (req, res) => {
  res.json({
    message: 'This is an example endpoint',
    data: {
      tip: 'Replace this with your actual API endpoints',
      suggestions: [
        'Create models in the /models directory',
        'Add controllers in the /controllers directory',
        'Implement middleware in the /middleware directory',
        'Add utility functions in the /utils directory'
      ]
    }
  });
});

module.exports = router;`;
    
    fs.writeFileSync(path.join(projectPath, 'routes', 'index.js'), routesJS);
    spinner.succeed(chalk.green('✅ Routes created'));

    // Step 8: Create .env file
    spinner.start(chalk.blue('Creating environment configuration...'));
    
    const envContent = `# Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/${projectName}

# Add your environment variables here
# JWT_SECRET=your_jwt_secret_here
# API_KEY=your_api_key_here`;
    
    fs.writeFileSync(path.join(projectPath, '.env'), envContent);
    
    // Create .env.example
    const envExampleContent = `# Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/${projectName}

# Add your environment variables here
# JWT_SECRET=your_jwt_secret_here
# API_KEY=your_api_key_here`;
    
    fs.writeFileSync(path.join(projectPath, '.env.example'), envExampleContent);
    spinner.succeed(chalk.green('✅ Environment configuration created'));

    // Step 9: Create .gitignore
    spinner.start(chalk.blue('Creating .gitignore...'));
    
    const gitignoreContent = `# Dependencies
node_modules/

# Environment variables
.env

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# VS Code
.vscode/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`;
    
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent);
    spinner.succeed(chalk.green('✅ .gitignore created'));

    // Step 10: Create README
    spinner.start(chalk.blue('Creating README.md...'));
    
    const readmeContent = `# ${projectName}

Backend API built with Node.js, Express, and MongoDB

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - Document database with Mongoose ODM
- **Security** - Helmet.js for security headers
- **CORS** - Cross-origin resource sharing enabled
- **Logging** - Morgan for HTTP request logging
- **Environment Variables** - dotenv for configuration
- **Development** - Nodemon for auto-restart

## 📁 Project Structure

\`\`\`
${projectName}/
├── server.js          # Server entry point
├── app.js             # Express app configuration
├── db/
│   └── db.js          # Database connection
├── routes/
│   └── index.js       # API routes
├── models/            # Mongoose models
├── controllers/       # Route controllers
├── middleware/        # Custom middleware
├── utils/             # Utility functions
├── .env               # Environment variables
└── package.json       # Dependencies
\`\`\`

## 🛠️ Installation

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. Start MongoDB (make sure MongoDB is running)

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## 📡 API Endpoints

- \`GET /\` - Welcome message
- \`GET /api\` - API welcome
- \`GET /api/health\` - Health check
- \`GET /api/example\` - Example endpoint

## 🔧 Environment Variables

\`\`\`env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/${projectName}
\`\`\`

## 📝 Development

- \`npm start\` - Start production server
- \`npm run dev\` - Start development server with nodemon

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Created with ❤️ using OneTap CLI`;
    
    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);
    spinner.succeed(chalk.green('✅ README.md created'));

    // Success message
    console.log(chalk.green('\n🎉 Backend project setup completed successfully!\n'));
    console.log(chalk.cyan('📁 Project created at:'), chalk.white(projectPath));
    console.log(chalk.cyan('🚀 To get started:\n'));
    console.log(chalk.white(`   cd ${projectName}`));
    console.log(chalk.white('   npm run dev\n'));
    console.log(chalk.yellow('✨ Features included:'));
    console.log(chalk.white('   • Node.js + Express.js server'));
    console.log(chalk.white('   • MongoDB with Mongoose ODM'));
    console.log(chalk.white('   • Security middleware (Helmet, CORS)'));
    console.log(chalk.white('   • Request logging with Morgan'));
    console.log(chalk.white('   • Environment variables setup'));
    console.log(chalk.white('   • Clean project structure'));
    console.log(chalk.white('   • Development server with Nodemon\n'));
    console.log(chalk.cyan('📖 Next steps:'));
    console.log(chalk.white('   • Make sure MongoDB is running'));
    console.log(chalk.white('   • Configure .env file'));
    console.log(chalk.white('   • Add your models and routes'));
    console.log(chalk.white('   • Start building your API! 🚀\n'));

  } catch (error) {
    spinner.fail(chalk.red('❌ Backend setup failed'));
    console.error(chalk.red('Error details:'), error.message);
    
    // Clean up partially created project
    if (fs.existsSync(projectName)) {
      console.log(chalk.yellow('🧹 Cleaning up...'));
      fs.removeSync(projectName);
    }
    
    throw error;
  }
};

module.exports = { setupBackend };