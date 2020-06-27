/*
 * Injects the App stub into the global scope.
 * Bundled HomeApp cannot be loaded until this global is set.
 */
import { AppStub } from './smart-home-app';

(global as any).smarthome = {
  App: AppStub,
  Intents: {
    IDENTIFY: 'action.devices.IDENTIFY',
    EXECUTE: 'action.devices.EXECUTE',
  },
};

//TODO(cjdaly) find a cleaner way to do this.
export function loadHomeApp(path: string) {
  // Implicitly runs the JavaScript module at `path`
  require(path);
}
