import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { execSync } from "child_process";
import { createFile } from "../utils/fileSystem.js"; // <-- extension add karna zaruri h ESM mein

export async function setupBackend(level = "Beginner", projectName = null) {
  try {
    const finalProjectName = projectName || `backend-${level.toLowerCase()}`;
    const projectPath = path.join(process.cwd(), finalProjectName);

    console.log(chalk.blue(`\n🚀 Setting up ${level} Backend in ${finalProjectName}...\n`));
    await fs.ensureDir(projectPath);

    if (level === "Beginner") {
      // folders
      await fs.ensureDir(path.join(projectPath, "src", "db"));

      // src/app.js
      createFile(
        path.join(projectPath, "src"),
        "app.js",
`import express from "express";
const app = express();

export default app;`
      );

      // src/db/db.js
      createFile(
        path.join(projectPath, "src", "db"),
        "db.js",
`import mongoose from "mongoose";

function connectDB() {
  mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/myApp")
    .then(() => {
      console.log("✅ Database Connected Successfully");
    })
    .catch((err) => {
      console.log("❌ DB Connection Error:", err);
    });
}

export default connectDB;`
      );

      // server.js
      createFile(
        projectPath,
        "server.js",
`import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";

connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});`
      );

      // .env
      createFile(
        projectPath,
        ".env",
`PORT=3000
MONGO_URI=mongodb://localhost:27017/myApp`
      );

      // .gitignore
      createFile(
        projectPath,
        ".gitignore",
`node_modules
.env`
      );
    }

    if (level === "Intermediate") {
      // folders
      const folders = ["src/db", "src/routes", "src/models", "src/controllers", "src/middleware"];
      for (const f of folders) {
        await fs.ensureDir(path.join(projectPath, f));
      }

      // src/app.js
      createFile(
        path.join(projectPath, "src"),
        "app.js",
`import express from "express";
import cors from "cors";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// routes
app.use("/api/users", userRoutes);

export default app;`
      );

      // src/db/db.js
      createFile(
        path.join(projectPath, "src", "db"),
        "db.js",
`import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/myApp");
    console.log("✅ Database Connected Successfully");
  } catch (err) {
    console.log("❌ DB Connection Error:", err);
    process.exit(1);
  }
}

export default connectDB;`
      );

      // src/models/User.js
      createFile(
        path.join(projectPath, "src", "models"),
        "User.js",
`import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.model("User", userSchema);`
      );

      // src/controllers/userController.js
      createFile(
        path.join(projectPath, "src", "controllers"),
        "userController.js",
`// Dummy controller
export const getUsers = (req, res) => {
  res.json([{ name: "Test User", email: "test@example.com" }]);
};`
      );

      // src/routes/userRoutes.js
      createFile(
        path.join(projectPath, "src", "routes"),
        "userRoutes.js",
`import { Router } from "express";
import { getUsers } from "../controllers/userController.js";

const router = Router();

router.get("/", getUsers);

export default router;`
      );

      // src/middleware/logger.js
      createFile(
        path.join(projectPath, "src", "middleware"),
        "logger.js",
`// sample custom middleware
function logger(req, res, next) {
  console.log(\`\${req.method} \${req.url}\`);
  next();
}

export default logger;`
      );

      // server.js
      createFile(
        projectPath,
        "server.js",
`import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";

connectDB();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});`
      );

      // .env
      createFile(
        projectPath,
        ".env",
`PORT=4000
MONGO_URI=mongodb://localhost:27017/myApp`
      );

      // .gitignore
      createFile(
        projectPath,
        ".gitignore",
`node_modules
.env`
      );
    }

    console.log(chalk.yellow("\n📦 Installing dependencies..."));
    execSync(
      "npm init -y && npm install express mongoose cors morgan dotenv && npm install -D nodemon",
      { stdio: "inherit", cwd: projectPath }
    );

    // add scripts
    const pkgPath = path.join(projectPath, "package.json");
    const pkg = await fs.readJson(pkgPath);
    pkg.type = "module"; // 👈 ESM enable
    pkg.scripts = { start: "node server.js", dev: "nodemon server.js" };
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    console.log(chalk.green(`\n✅ ${level} Backend setup complete!`));
  } catch (error) {
    console.error(chalk.red("❌ Backend setup error:"), error);
  }
}
