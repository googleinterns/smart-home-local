/*
 * Injects the App stub into the global scope.
 * Bundled HomeApp cannot be loaded until this global is set.
 */
import {AppStub} from './smart-home-app';

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

export function injectSmarthomeStubs() {
  (global as any).smarthome = smarthomeStub;
}