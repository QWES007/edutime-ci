import { schedulingEngine, type ScheduleGenerationResult } from "@/lib/scheduling/engine";
import { dataService } from "@/lib/services/data-service";

export const scheduleService = {
  async generate(): Promise<ScheduleGenerationResult> {
    // Appelle la méthode generate de notre classe de planification
    return await schedulingEngine.generate();
  }
};