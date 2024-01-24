import { Characteristic, Device } from 'react-native-ble-plx';
import { BLEService } from './ble-service';
import { ConcreteConnectedDevice } from './concrete-connected-device';

class MockBLEService implements BLEService {
  scanDevices(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDeviceFound: (device: Device) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UUIDs?: string[] | null | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    legacyScan?: boolean | undefined
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connectToDevice(deviceId: string): Promise<ConcreteConnectedDevice> {
    throw new Error('Method not implemented.');
  }
  isDeviceConnected(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  readCharacteristicForDevice(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    serviceUUID: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    characteristicUUID: string
  ): Promise<Characteristic> {
    throw new Error('Method not implemented.');
  }
}

export default function createMockBLEService(): BLEService {
  return new MockBLEService();
}
