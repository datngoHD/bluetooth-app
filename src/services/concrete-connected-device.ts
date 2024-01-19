import { Buffer } from 'buffer';
import { Device, UUID, Subscription as BleSubscription, } from "react-native-ble-plx";
import { ConnectedDevice } from "./ble-service";
import { Observable, ReplaySubject, lastValueFrom, map, take } from 'rxjs';

const CarbonBlackShine2DeviceId: UUID = "3B015AD2-FBDC-7E47-4E4D-ECCFF8FBC20A";
const CarbonBlackShine2ServiceUuid: UUID = "180a";
const deviceInfoServiceUuid: UUID = '180a';
const serviceUuid: UUID = '1809';
const intermediateTemperatureUuid: UUID = '2A1E';
const temperatureMeasurementUuid: UUID = '2A1C';
const temperatureTypeUuid: UUID = '2A1D';
const temperatureIntervalUuid: UUID = '2A21';
const serialNumberUuid: UUID = '2A25';

export class ConcreteConnectedDevice implements ConnectedDevice {
    private readonly device: Device;
    private readonly processReadingsSubscription: BleSubscription;
    private readonly processReadings = new ReplaySubject<{[name: string]: string}>(1);
  
    constructor(d: Device) {
      console.log('connected device constructor');
      this.device = d;
      
      this.device.readCharacteristicForService(
        serviceUuid,
        intermediateTemperatureUuid
      ).then(c => this.parseProcessReadings(c.value, 'intermediateTemperature'));

      this.processReadingsSubscription =
      this.device.monitorCharacteristicForService(
        serviceUuid,
        intermediateTemperatureUuid,
        (err, c) => {
          if (err) {
            this.processReadings.error(err);
            this.processReadingsSubscription.remove();
          } else if (c?.value) {
            this.parseProcessReadings(c.value, 'intermediateTemperature');
          }
        }
      );
    }

    private parseProcessReadings(value: string | undefined | null, name: string) {
      if (value === undefined || value === null) {
        return;
      }

      const readings = {
        [name]: Buffer.from(value, 'base64').toString('utf8')
      };
  
      this.processReadings.next(readings);
    }
  
    disconnect(): Promise<void> {
      throw new Error("Method not implemented.");
    }

    async readIntermediateTemperature(): Promise<string> {
      return lastValueFrom(this.watchIntermediateTemperature().pipe(take(1)));
    }
    async readTemperatureMeasurement(): Promise<string> {
        const c = await this.device.readCharacteristicForService(
            serviceUuid,
            temperatureMeasurementUuid
          );
      
          if (c.value === null) {
            throw new Error('Failed to read serial number');
          }
      
          const buf = Buffer.from(c.value, 'base64');
          return buf.toString('ascii');
    }
    async readTemperatureType(): Promise<string> {
        const c = await this.device.readCharacteristicForService(
            serviceUuid,
            temperatureTypeUuid
          );
      
          if (c.value === null) {
            throw new Error('Failed to read serial number');
          }
      
          const buf = Buffer.from(c.value, 'base64');
          return buf.toString('ascii');
    }
    async readTemperatureInterval(): Promise<string> {
        const c = await this.device.readCharacteristicForService(
            serviceUuid,
            temperatureIntervalUuid
          );
      
          if (c.value === null) {
            throw new Error('Failed to read serial number');
          }
      
          const buf = Buffer.from(c.value, 'base64');
          return buf.toString('ascii');
    }

    watchIntermediateTemperature(): Observable<string> {
      return this.processReadings.pipe(map((s) => s['intermediateTemperature']));
    }

    async writeIntermediateTemperature(valueBase64: string): Promise<void> {
      const c = await this.device.writeCharacteristicWithResponseForService(
        serviceUuid,
        intermediateTemperatureUuid,
        valueBase64
      );
      console.log('writeIntermediateTemperature: ', c);
    }

    writeTemperatureMeasurement(valueBase64: string): Promise<void> {
      throw new Error('Method not implemented.');
    }
    writeTemperatureType(valueBase64: string): Promise<void> {
      throw new Error('Method not implemented.');
    }
    writeTemperatureInterval(valueBase64: string): Promise<void> {
      throw new Error('Method not implemented.');
    }
    watchTemperatureMeasurement(): Observable<string> {
      throw new Error('Method not implemented.');
    }
    watchTemperatureType(): Observable<string> {
      throw new Error('Method not implemented.');
    }
    watchTemperatureInterval(): Observable<string> {
      throw new Error('Method not implemented.');
    }
  
  }