import { DashboardController } from "../../backend/api/controller";

export default function handler(req: Request): Promise<Response> {
  return DashboardController.syncProductivity(req);
}
