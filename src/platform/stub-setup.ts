/*
 * Injects the App stub into the global scope.
 * Bundled HomeApp cannot be loaded until this global is set.
 */
import {AppStub} from './smart-home-app';

export var ERROR_UNDEFINED_APP_STUB: string =
  'Active AppStub is undefined.  Has an App been initialized?';

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

// Module-level variable to hold the active instance the AppStub
var activeAppStub: AppStub | undefined;

// Module-level getter for the active AppStub
export function getActiveAppStub(): AppStub {
  if (activeAppStub === undefined) {
    throw new Error(ERROR_UNDEFINED_APP_STUB);
  }
  return activeAppStub;
}

// Module-level setter for the active AppStub
export function setActiveAppStub(app: AppStub) {
  activeAppStub = app;
}
