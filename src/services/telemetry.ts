import { useSettingsStore } from '@/stores/settings-store';

type TelemetryEvent =
  | 'app_start'
  | 'file_imported'
  | 'optimization_started'
  | 'optimization_completed'
  | 'export_started'
  | 'license_activated'
  | 'sample_data_loaded';

class TelemetryService {
  private isEnabled(): boolean {
    // In a real hook-less class, we access the state directly
    return useSettingsStore.getState().telemetryEnabled;
  }

  public trackEvent(event: TelemetryEvent, properties?: Record<string, any>) {
    if (!this.isEnabled()) return;

    // In V1.0, we just log to console in dev or mock in prod
    // This prepares the infrastructure for V1.1 real analytics
    console.log(`[Telemetry] ${event}`, properties || {});

    // Future:
    // fetch('https://api.changeoveroptimizer.com/telemetry', {
    //   method: 'POST',
    //   body: JSON.stringify({ event, properties, timestamp: new Date() })
    // });
  }
}

export const telemetry = new TelemetryService();


