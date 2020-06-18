/**
 * simple tests to verify stub behaviors
 **/
import test from 'ava';
import { deviceManagerStub } from '../common/device-manager';
import { UDPDevice, DiscoveryData, MockNetwork } from '../common/mock-radio';
import {
  MockLocalHomePlatform,
  UDPScanConfig,
  ScanState,
} from '../common/mock-local-home-platform';
import * as cbor from 'cbor';

test('device-manager-throws-error', async (t) => {
  const randomErrorCode = 'some-error';
  const deviceManager = deviceManagerStub('randomDeviceId', {
    errorCode: randomErrorCode,
  });
  try {
    const result = await deviceManager.send(null);
    t.fail();
  } catch (error) {
    t.is(error.errorCode, randomErrorCode);
  }
});

// Tests a UDP identify flow end-to-end using stubs and mocks
test('udp-device-connects', (t) => {
  // LHP detects virtual device
  // send IDENTITY request to compiled 3P javascript
  // await IdentityResponse from 3P javascript
  // fulfillment path confirmed
  // Pass test

  // Scan configuration
  const broadcastAddress: string = '255.255.255.255';
  const broadcastPort: number = 3312;
  const listenPort: number = 3311;
  const discoveryPacket: string = 'A5A5A5A5';
  const scanConfig = new UDPScanConfig(
    ScanState.Unprovisioned,
    broadcastAddress,
    listenPort,
    broadcastPort,
    discoveryPacket
  );

  // Mock a network that implements UDP
  const mockNetwork = new MockNetwork();

  // Mock the Local Home Platform
  const mockLocalHomePlatform = new MockLocalHomePlatform(mockNetwork, [
    scanConfig,
  ]);

  // Mock a UDP Device
  const mockDevice = new UDPDevice();

  // Device data that mock device sends back
  const discoveryData: DiscoveryData = new DiscoveryData(
    'test-device-id',
    '2',
    '0.0.1',
    '1.2.3',
    [12345]
  );

  // Sample device response
  mockDevice.setUDPMessageAction((msg: Buffer, rinfo: any) => {
    const packetBuffer = Buffer.from(discoveryPacket, 'hex');
    if (msg.compare(packetBuffer) !== 0) {
      console.warn('UDP received unknown payload:', msg, 'from:', rinfo);
      return;
    }
    console.debug('UDP received discovery payload:', msg, 'from:', rinfo);

    // TODO add error path
    const responsePacket = cbor.encode(discoveryData);
    mockNetwork.sendUDPMessage(
      responsePacket,
      rinfo.port,
      rinfo.address,
      discoveryData.channels[0],
      broadcastAddress
    );
  });

  mockNetwork.registerUDPListener(mockDevice, broadcastPort, broadcastAddress);

  // Start scanning
  mockLocalHomePlatform.triggerScan();

  t.pass();
});
