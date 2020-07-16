import {smarthomeStub} from './platform/stub-setup';
export * from './platform/mock-local-home-platform';
export * from './platform/stub-setup';
export * from './platform/smart-home-app';
(global as any).smarthome = smarthomeStub;
