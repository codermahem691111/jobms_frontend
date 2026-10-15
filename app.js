const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const AdminAuthService = require("./services/AdminAuthService");
const AuthMiddleware = require("./middleware/AuthMiddleware");
const AdminController = require("./controllers/AdminController");
const AdminRoutes = require("./routes/AdminRoutes");

class App {
  constructor(config) {
    this.config = config;
    this.instance = express();
    this.#middlewares();
    this.#routes();
    this.#errorHandlers();
  }

  #middlewares() {
    this.instance.set("trust proxy", 1);
    this.instance.use(helmet());
    this.instance.use(cors({ origin: this.config.clientUrl, credentials: true }));
    this.instance.use(express.json({ limit: "10kb" }));
    this.instance.use(cookieParser());
  }

  #routes() {
    const adminAuthService = new AdminAuthService(this.config);
    const authMiddleware = new AuthMiddleware(adminAuthService);
    const adminController = new AdminController(adminAuthService, this.config);
    const adminRoutes = new AdminRoutes(adminController, authMiddleware);

    this.instance.get("/api/health", (req, res) => res.json({ status: "ok" }));
    this.instance.use("/api/admin", adminRoutes.router);
  }

  #errorHandlers() {
    this.instance.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));
    this.instance.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    });
  }
}

module.exports = App;
