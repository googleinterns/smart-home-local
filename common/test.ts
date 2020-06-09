/**
* simple tests to verify stub behaviors
**/

import test from 'ava';
import { deviceManagerStub } from './device-manager';
import { smarthomeAppStub } from './smart-home-app';

test('device-manager-error', async t => {
  const randomErrorCode = 'some-error';
  const deviceManager = 
    deviceManagerStub("randomDeviceId", {errorCode: randomErrorCode});
  try {
    const result = await deviceManager.send(null);
    t.fail();
  } catch (error){
    t.is(error.errorCode, randomErrorCode);
  }
});

test('foo', t => {
  t.pass();
});

test('bar', async t => {
  const bar = Promise.resolve('bar');
  t.is(await bar, 'bar');
});
