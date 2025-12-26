
import { registerSystemHandlers } from './system-handlers';
import { registerSmedHandlers } from './smed-handlers';
import { registerAnalyticsHandlers } from './analytics-handlers';
import { registerChangeoverHandlers } from './changeover-handlers';
import { registerConfigurationsHandlers } from './configurations-handlers';

export function registerAllHandlers() {
  registerSystemHandlers();
  registerSmedHandlers();
  registerAnalyticsHandlers();
  registerChangeoverHandlers();
  registerConfigurationsHandlers();
}
