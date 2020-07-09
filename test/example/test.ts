/*
 * Example tests against stubs
 */
/// <reference types="@google/local-home-sdk" />
/// <reference types="@types/node" />
import test from 'ava';
import cbor from 'cbor';
import {UDPDevice, MockNetwork} from '../../src/platform/mock-radio';
import {injectSmarthomeStubs} from '../../src/platform/stub-setup';
import {MockLocalHomePlatform} from '../../src/platform/mock-local-home-platform';

// Common address for all UDP messaging
const updAddress: string = '255.255.255.255';

// Tests a UDP identify flow end-to-end
test('udp-device-connects', async t => {
  // Mock a UDP Network
  const mockNetwork = new MockNetwork();

  // Mock the Local Home Platform
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance();

  const mockDevice = new UDPDevice(
    'test-device-id',
    mockNetwork,
    12345,
    updAddress
  );

  injectSmarthomeStubs();

  // Assert listen() was called and handlers were loaded
  t.is(mockLocalHomePlatform.isHomeAppReady(), true);
  injectSmarthomeStubs;
  try {
    // Trigger Identify message to be sent to the Local Home Platform's port
    mockLocalHomePlatform.triggerIdentify(
      cbor.encode({
        id: mockDevice.getDeviceId,
        model: '2',
        hw_rev: '0.0.1',
        fw_rev: '1.2.3',
        channels: [mockDevice.getDevicePort()],
      })
    );
  } catch (error) {
    t.fail(error.message);
  }

  // Create promise to catch next deviceId registered
  t.is(
    await mockLocalHomePlatform.getNextDeviceIdRegistered(),
    mockDevice.getDeviceId()
  );
  t.is(mockLocalHomePlatform.getLocalDeviceIdMap().size, 1);
  t.is(
    mockLocalHomePlatform.getLocalDeviceIdMap().values().next().value,
    mockDevice.getDeviceId()
  );
});
