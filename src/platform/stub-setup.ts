/*
 * Injects the App stub into the global scope.
 * Bundled HomeApp cannot be loaded until this global is set.
 */
import {AppStub} from './smart-home-app';
import {MockLocalHomePlatform} from './mock-local-home-platform';

const smarthomeStub: {
  App: typeof smarthome.App;
  Intents: {[key in keyof typeof smarthome.Intents]: string};
} = {
  App: AppStub,
  Intents: {
    EXECUTE: 'action.devices.EXECUTE',
    IDENTIFY: 'action.devices.IDENTIFY',
    REACHABLE_DEVICES: 'action.devices.REACHABLE_DEVICES',
  },
};

// Injects stubs into the global scope, allowing implicit usage for testing
export function injectSmarthomeStubs(): void {
  (global as any).smarthome = smarthomeStub;
}

// Promotes App to AppStub
export function extractMockLocalHomePlatform(
  app: smarthome.App
): MockLocalHomePlatform | undefined {
  if (app instanceof AppStub) {
    return app.getLocalHomePlatform();
  }
  return undefined;
}
