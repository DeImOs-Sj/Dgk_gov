import { Router } from "express";
import { ServiceContainer } from "../services/ServiceContainer";
import { AssetController } from "./AssetController";
import { MetricsController } from "./MetricsController";
import { AdminController } from "./AdminController";

export function registerControllers(
  router: Router,
  container: ServiceContainer,
): void {
  // Initialize controllers
  const assetController = new AssetController(container);
  const metricsController = new MetricsController(container);
  const adminController = new AdminController(container);

  // Register routes
  assetController.registerRoutes(router);
  metricsController.registerRoutes(router);
  adminController.registerRoutes(router);
}

// Re-export controllers
export { AssetController } from "./AssetController";
export { MetricsController } from "./MetricsController";
export { AdminController } from "./AdminController";
