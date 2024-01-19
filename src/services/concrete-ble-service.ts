import { PermissionsAndroid, Platform } from 'react-native';
import {
  BleError,
  BleErrorCode,
  BleManager,
  Device,
  State as BluetoothState,
  LogLevel,
  type DeviceId,
  type TransactionId,
  type UUID,
  type Characteristic,
  type Base64,
  type Subscription,
  fullUUID,
  ScanOptions,
  ScanMode
} from 'react-native-ble-plx'
import { BLEService } from './ble-service';
import { Observable } from 'rxjs';
import { ConcreteConnectedDevice } from './concrete-connected-device';

const deviceNotConnectedErrorText = 'Device is not connected'

class ConcreteBLEService implements BLEService {
    private bleManager: BleManager;
    private device: Device | null;
    private connectedDevice: ConcreteConnectedDevice | undefined;
  
    constructor() {
      this.device = null
      this.bleManager = new BleManager()
      this.bleManager.setLogLevel(LogLevel.Verbose)
      this.initializeBLE();
    }

    initializeBLE = () =>
    new Promise<void>(resolve => {
      const subscription = this.bleManager.onStateChange(state => {
        switch (state) {
          case BluetoothState.Unsupported:
            console.error('The platform does not support Bluetooth low energy');
            break
          case BluetoothState.PoweredOff:
            console.error('Bluetooth is currently powered off');
            this.bleManager.enable().catch((error: BleError) => {
              if (error.errorCode === BleErrorCode.BluetoothUnauthorized) {
                console.error('There are no granted permissions which allow to use BLE functionality. On Android it may require android.permission.ACCESS_COARSE_LOCATION permission or android.permission.ACCESS_FINE_LOCATION permission');
                this.requestBluetoothPermission()
              }
            })
            break
          case BluetoothState.Unauthorized:
            this.requestBluetoothPermission()
            break
          case BluetoothState.PoweredOn:
            resolve()
            subscription.remove()
            break
          default:
            console.error('Unsupported state: ', state)
        }
      }, true)
    })

    requestBluetoothPermission = async () => {
      if (Platform.OS === 'ios') {
        return true
      }
      if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
        const apiLevel = parseInt(Platform.Version.toString(), 10)
  
        if (apiLevel < 31) {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
          return granted === PermissionsAndroid.RESULTS.GRANTED
        }
        if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN && PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          ])
  
          return (
            result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
          )
        }
      }
  
      console.error('Permission have not been granted');

      return false
    }

    onError = (error: BleError) => {
      switch (error.errorCode) {
        case BleErrorCode.BluetoothUnauthorized:
          this.requestBluetoothPermission()
          break
        case BleErrorCode.LocationServicesDisabled:
          console.error('Location services are disabled')
          break
        default:
          console.error(JSON.stringify(error, null, 4));
      }
    }

    scanDevices = async (onDeviceFound: (device: Device) => void, UUIDs: UUID[] | null = null, legacyScan?: boolean) => {
      this.bleManager.startDeviceScan(UUIDs, { allowDuplicates: true, scanMode: ScanMode.LowLatency, legacyScan }, (error, device) => {
        if (error) {
          this.onError(error)
          console.error(error.message)
          this.bleManager.stopDeviceScan()
          return
        }
        if (device) {
          onDeviceFound(device)
        }
      })
    }

    connectToDevice = (deviceId: DeviceId) =>
    new Promise<ConcreteConnectedDevice>((resolve, reject) => {
      this.bleManager.stopDeviceScan()
      this.bleManager
        .connectToDevice(deviceId, { timeout: 10000 })
        .then(async device => {
          await device.discoverAllServicesAndCharacteristics();
          this.device = device
          this.connectedDevice = new ConcreteConnectedDevice(device);
          resolve(this.connectedDevice)
        })
        .catch(error => {
          if (error.errorCode === BleErrorCode.DeviceAlreadyConnected && this.device) {
            // resolve(this.connectedDevice)
          } else {
            this.onError(error)
            reject(error)
          }
        })
    })

    isDeviceConnected = () => {
      if (!this.device) {
        console.error(deviceNotConnectedErrorText)
        throw new Error(deviceNotConnectedErrorText)
      }
      return this.bleManager.isDeviceConnected(this.device.id)
    }
  }

  export function createBLEService(): BLEService {
    return new ConcreteBLEService();
  }