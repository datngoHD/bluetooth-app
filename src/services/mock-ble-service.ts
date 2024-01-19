import { Characteristic, Device } from "react-native-ble-plx";
import { BLEService } from "./ble-service";
import { ConcreteConnectedDevice } from "./concrete-connected-device";

class MockBLEService implements BLEService {
    scanDevices(onDeviceFound: (device: Device) => void, UUIDs?: string[] | null | undefined, legacyScan?: boolean | undefined): Promise<void> {
      throw new Error("Method not implemented.");
    }
    connectToDevice(deviceId: string): Promise<ConcreteConnectedDevice> {
      throw new Error("Method not implemented.");
    }
    isDeviceConnected(): Promise<boolean> {
      throw new Error("Method not implemented.");
    }
    readCharacteristicForDevice(serviceUUID: string, characteristicUUID: string): Promise<Characteristic> {
      throw new Error("Method not implemented.");
    }
  }

  export default function createMockBLEService(): BLEService {
    return new MockBLEService();
  }