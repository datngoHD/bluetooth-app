import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { BLEService, ConnectedDevice, createBLEService } from './src/services';
import { Device, UUID } from 'react-native-ble-plx';
import { cloneDeep } from './src/utils/cloneDeep';
import {
  MD3LightTheme as DefaultTheme,
  PaperProvider,
  List as PaperList,
  Divider,
  Button,
  Text,
  TextInput,
} from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'green',
    secondary: 'yellow',
  },
};

type DeviceExtendedByUpdateTime = Device & { updateTimestamp: number };
const MIN_TIME_BEFORE_UPDATE_IN_MILLISECONDS = 5000;

const serviceUUID: UUID = '1809';

export default function App() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [foundDevices, setFoundDevices] = useState<
    DeviceExtendedByUpdateTime[]
  >([]);
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [intermediateTemperatureValue, setIntermediateTemperatureValue] =
    useState('');
  const [temperatureMeasurementValue, setTemperatureMeasurementValue] =
    useState('');
  const [temperatureTypeValue, setTemperatureTypeValue] = useState('');
  const [temperatureIntervalValue, setTemperatureIntervalValue] = useState('');

  const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice>();

  const bleService: BLEService = useMemo<BLEService>(() => {
    return createBLEService();
  }, []);

  useEffect(() => {
    bleService?.scanDevices(addFoundDevice, [serviceUUID], true);
  }, []);

  const isFoundDeviceUpdateNecessary = (
    currentDevices: DeviceExtendedByUpdateTime[],
    updatedDevice: Device
  ) => {
    const currentDevice = currentDevices.find(
      ({ id }) => updatedDevice.id === id
    );
    if (!currentDevice) {
      return true;
    }
    return currentDevice.updateTimestamp < Date.now();
  };

  const addFoundDevice = (device: Device) => {
    if (!device.name && !device.localName) return;
    setFoundDevices((prevState) => {
      if (!isFoundDeviceUpdateNecessary(prevState, device)) {
        return prevState;
      }
      // deep clone
      const nextState = cloneDeep(prevState);
      const extendedDevice: DeviceExtendedByUpdateTime = {
        ...device,
        updateTimestamp: Date.now() + MIN_TIME_BEFORE_UPDATE_IN_MILLISECONDS,
      } as DeviceExtendedByUpdateTime;

      const indexToReplace = nextState.findIndex(
        (currentDevice) => currentDevice.id === device.id
      );
      if (indexToReplace === -1) {
        return nextState.concat(extendedDevice);
      }
      nextState[indexToReplace] = extendedDevice;
      return nextState;
    });
  };

  const onConnectSuccess = (d: ConnectedDevice) => {
    setConnectedDevice(d);
    setIsConnecting(false);
    bleService.isDeviceConnected().then((connectionStatus) => {
      if (!connectionStatus) {
        throw new Error('isDeviceConnected error');
      }
      setConnected(connectionStatus);
    });
  };

  const readIntermediateTemperature = async () => {
    if (!connectedDevice) {
      console.error('isDeviceConnected error');
      return;
    }
    setIntermediateTemperatureValue('');
    const value = await connectedDevice.readIntermediateTemperature();
    setIntermediateTemperatureValue(value);
  };

  const readTemperatureMeasurement = async () => {
    if (!connectedDevice) {
      console.error('isDeviceConnected error');
      return;
    }
    setTemperatureMeasurementValue('');
    const value = await connectedDevice.readTemperatureMeasurement();
    setTemperatureMeasurementValue(value);
  };

  const readTemperatureType = async () => {
    if (!connectedDevice) {
      console.error('isDeviceConnected error');
      return;
    }
    setTemperatureTypeValue('');
    const value = await connectedDevice.readTemperatureType();
    setTemperatureTypeValue(value);
  };

  const readTemperatureInterval = async () => {
    if (!connectedDevice) {
      console.error('isDeviceConnected error');
      return;
    }
    setTemperatureIntervalValue('');
    const value = await connectedDevice.readTemperatureInterval();
    setTemperatureIntervalValue(value);
  };

  const writeIntermediateTemperature = async () => {
    if (!connectedDevice) {
      console.error('isDeviceConnected error');
      return;
    }
    setIntermediateTemperatureValue('');
    // setIntermediateTemperatureValue(value);
  };

  const monitorIntermediateTemperature = async () => {
    if (!connectedDevice) {
      console.error('isDeviceConnected error');
      return;
    }
    connectedDevice.watchIntermediateTemperature().subscribe((value) => {
      setIntermediateTemperatureValue(value);
    });
  };

  const onConnectFail = () => {
    setIsConnecting(false);
  };

  const deviceRender = (device: Device) => (
    <React.Fragment key={device.id}>
      <Divider />
      <PaperList.Item
        key={device.id}
        title={device.name}
        description={`Connection status: ${isConnecting ? 'connecting...' : String(connected)}`}
        onPress={() => {
          setConnected(false);
          setIsConnecting(true);
          setIntermediateTemperatureValue('');
          setTemperatureIntervalValue('');
          setTemperatureTypeValue('');
          setTemperatureMeasurementValue('');
          bleService
            .connectToDevice(device.id)
            .then(onConnectSuccess)
            .catch(onConnectFail);
        }}
      />
      <Divider />
    </React.Fragment>
  );

  return (
    <PaperProvider theme={theme}>
      <ScrollView>
        <View style={styles.container}>
          <Text variant="headlineMedium">{'Nearby devices list\n'}</Text>
          <StatusBar style="auto" />
          {foundDevices.map((item) => deviceRender(item))}
          {connectedDevice && connected && (
            <>
              <TextInput
                disabled={!connected}
                label="Characteristic value"
                value={text}
                mode={'outlined'}
                onChangeText={(text) => setText(text)}
                style={{ marginTop: 20 }}
              />

              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 30 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={readIntermediateTemperature}
              >
                Read Intermediate Temperature{' '}
                {intermediateTemperatureValue
                  ? ' - ' + intermediateTemperatureValue
                  : ''}
              </Button>
              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 10 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={writeIntermediateTemperature}
              >
                Write Intermediate Temperature {text ? '- ' + text : ''}
              </Button>
              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 10 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={monitorIntermediateTemperature}
              >
                Monitor Intermediate Temperature
              </Button>

              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 30 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={readTemperatureMeasurement}
              >
                Read Temperature Measurement{' '}
                {temperatureMeasurementValue
                  ? ' - ' + temperatureMeasurementValue
                  : ''}
              </Button>
              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 10 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={readTemperatureMeasurement}
              >
                Read Temperature Measurement{' '}
                {temperatureMeasurementValue
                  ? ' - ' + temperatureMeasurementValue
                  : ''}
              </Button>

              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 30 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={readTemperatureType}
              >
                Read Temperature Type{' '}
                {temperatureTypeValue ? ' - ' + temperatureTypeValue : ''}
              </Button>
              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 10 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={readTemperatureType}
              >
                Read Temperature Type{' '}
                {temperatureTypeValue ? ' - ' + temperatureTypeValue : ''}
              </Button>

              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 30 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={readTemperatureInterval}
              >
                Read Temperature Interval{' '}
                {temperatureIntervalValue
                  ? ' - ' + temperatureIntervalValue
                  : ''}
              </Button>
              <Button
                contentStyle={{ justifyContent: 'flex-start' }}
                disabled={!connected}
                style={{ marginTop: 10 }}
                icon={connected ? 'check' : 'lock'}
                mode="outlined"
                onPress={readTemperatureInterval}
              >
                Read Temperature Interval{' '}
                {temperatureIntervalValue
                  ? ' - ' + temperatureIntervalValue
                  : ''}
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 100,
    paddingHorizontal: 10,
    // alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
