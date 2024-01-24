import { Device, UUID } from 'react-native-ble-plx';
import { ConcreteConnectedDevice } from './concrete-connected-device';
import { Observable } from 'rxjs';

export interface BLEService {
  scanDevices(
    onDeviceFound: (device: Device) => void,
    UUIDs?: UUID[] | null,
    legacyScan?: boolean
  ): Promise<void>;
  connectToDevice(deviceId: string): Promise<ConcreteConnectedDevice>;
  isDeviceConnected(): Promise<boolean>;
}

export interface ConnectedDevice {
  disconnect(): Promise<void>;

  readIntermediateTemperature(): Promise<string>;
  readTemperatureMeasurement(): Promise<string>;
  readTemperatureType(): Promise<string>;
  readTemperatureInterval(): Promise<string>;

  writeIntermediateTemperature(valueBase64: string): Promise<void>;
  writeTemperatureMeasurement(valueBase64: string): Promise<void>;
  writeTemperatureType(valueBase64: string): Promise<void>;
  writeTemperatureInterval(valueBase64: string): Promise<void>;

  watchIntermediateTemperature(): Observable<string>;
  watchTemperatureMeasurement(): Observable<string>;
  watchTemperatureType(): Observable<string>;
}
