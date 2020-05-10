import { CharacteristicEventTypes, Characteristic } from 'homebridge'
import type {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
} from 'homebridge'
import debounce from 'lodash.debounce'

import { ExampleHomebridgePlatform } from './platform'
import {
  powerStateFromValue,
  modeFromValue,
  activeFromPowerState,
  currentHeaterCoolerStateFromMode,
  targetHeaterCoolerStateFromMode,
  rotationSpeedFromFan,
  fanFromValue,
} from './thinq/convert'
import { GetDashboardResponse } from './thinq/apiTypes'

type Unpacked<T> = T extends (infer U)[] ? U : T

type cachedStateConfig = {
  power: 'on' | 'off' | null
  currentTemperature: number | null
  targetTemperature: number | null
  mode: 'cool' | 'dry' | 'fan' | null
  fan: 'low' | 'medium' | 'high' | null
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private cachedState: cachedStateConfig = {
    power: null,
    currentTemperature: null,
    targetTemperature: null,
    mode: null,
    fan: null,
  }

  getDevice(): Unpacked<GetDashboardResponse['result']['item']> | undefined {
    return this.accessory.context.device
  }

  getDeviceId() {
    return this.getDevice()?.deviceId
  }

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'LG Electronics',
      )
      .setCharacteristic(
        this.platform.Characteristic.Model,
        this.getDevice()?.modelName || 'Not available',
      )
      .setCharacteristic(
        this.platform.Characteristic.Name,
        this.getDevice()?.alias || 'Not available',
      )

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.HeaterCooler) ??
      this.accessory.addService(this.platform.Service.HeaterCooler)

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // create handlers for required characteristics
    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      .on(CharacteristicEventTypes.SET, this.handleActiveSet.bind(this))

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
      .on(
        CharacteristicEventTypes.SET,
        this.handleTargetHeaterCoolerStateSet.bind(this),
      )

    this.service
      .getCharacteristic(
        this.platform.Characteristic.CoolingThresholdTemperature,
      )
      .on(
        CharacteristicEventTypes.SET,
        debounce(this.handleTargetCoolingThresholdTemperature.bind(this), 1000),
      )

    this.updateCharacteristics()
    const refreshInterval = this.platform.refreshIntervalMinutes()
    this.platform.log.info(
      `Starting refresh interval (set to ${refreshInterval} minutes)`,
    )
    setInterval(
      this.updateCharacteristics.bind(this),
      refreshInterval * 60 * 1000,
    )
  }

  async updateCharacteristics() {
    if (!this.platform.thinqApi.getIsLoggedIn()) {
      this.platform.log.debug('Not logged in; skipping updateCharacteristics()')
      return
    }

    try {
      const device = await this.platform.thinqApi.getDevice(this.getDeviceId()!)

      // Store a cache of the state
      this.cachedState.power = powerStateFromValue(
        ('' + device.result.snapshot['airState.operation']) as '1' | '0',
      )
      this.cachedState.currentTemperature =
        device.result.snapshot['airState.tempState.current']
      this.cachedState.targetTemperature =
        device.result.snapshot['airState.tempState.target']
      this.cachedState.mode = modeFromValue(
        ('' + device.result.snapshot['airState.opMode']) as '0' | '1' | '2',
      )
      this.cachedState.fan = fanFromValue(
        // eslint-disable-next-line prettier/prettier
        ('' + device.result.snapshot['airState.windStrength']) as | '2' | '4' | '6',
      )

      // Emit updates to homebridge
      this.updateCharacteristicsFromState()

      this.platform.log.debug('Pushed updates to HomeKit', this.cachedState)
    } catch (error) {
      this.platform.log.error('Error during interval update', error.toString())
    }
  }

  updateCharacteristicsFromState() {
    if (this.cachedState.power) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.Active,
        activeFromPowerState(this.cachedState.power),
      )
    }
    if (this.cachedState.currentTemperature) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentTemperature,
        this.cachedState.currentTemperature,
      )
    }
    if (this.cachedState.targetTemperature) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.CoolingThresholdTemperature,
        this.cachedState.targetTemperature,
      )
    }
    if (this.cachedState.mode) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentHeaterCoolerState,
        currentHeaterCoolerStateFromMode(this.cachedState.mode),
      )
      this.service.updateCharacteristic(
        this.platform.Characteristic.TargetHeaterCoolerState,
        targetHeaterCoolerStateFromMode(this.cachedState.mode),
      )
    }
    if (this.cachedState.fan) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.RotationSpeed,
        rotationSpeedFromFan(this.cachedState.fan),
      )
    }
  }

  handleActiveSet(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug('Triggered SET Active:', value)

    const powerState = value === 1 ? 'on' : 'off'

    if (powerState === this.cachedState.power) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug(
        'Power state equals cached state. Skipping.',
        powerState,
      )
      callback(null)
      return
    }

    this.platform.thinqApi
      .setPower(this.getDeviceId()!, powerState)
      .then(() => {
        this.cachedState.power = powerState
        callback(null)
      })
      .catch((error) => callback(error))
  }

  handleTargetHeaterCoolerStateSet(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug('Triggered SET Heater Cooler State:', value)

    let mode: 'cool' | 'dry' | 'fan'
    switch (value) {
      case Characteristic.TargetHeaterCoolerState.COOL:
        mode = 'cool'
        break
      case Characteristic.TargetHeaterCoolerState.HEAT:
        mode = 'dry'
        break
      case Characteristic.TargetHeaterCoolerState.AUTO:
      default:
        mode = 'fan'
    }

    if (mode === this.cachedState.mode) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug(
        'Target heater cooler state equals cached state. Skipping.',
        mode,
      )
      callback(null)
      return
    }

    this.platform.thinqApi
      .setMode(this.getDeviceId()!, mode)
      .then(() => {
        this.cachedState.mode = mode
        callback(null)
      })
      .catch((error) => callback(error))
  }

  handleTargetCoolingThresholdTemperature(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug(
      'Triggered SET Cooling Threshold Temperature:',
      value,
    )

    let targetTemperature: number
    try {
      targetTemperature = Number(value)
    } catch (error) {
      this.platform.log.error('Could not parse temperature value', value, error)
      callback(error)
      return
    }

    if (targetTemperature === this.cachedState.targetTemperature) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug(
        'Target heater cooler state equals cached state. Skipping.',
        targetTemperature,
      )
      callback(null)
      return
    }

    this.platform.thinqApi
      .setTemperature(this.getDeviceId()!, targetTemperature)
      .then(() => {
        this.cachedState.targetTemperature = targetTemperature
        callback(null)
      })
      .catch((error) => callback(error))
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  // setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
  //   // implement your own code to turn your device on/off
  //   this.exampleStates.On = value as boolean

  //   this.platform.log.debug('Set Characteristic On ->', value)

  //   // you must call the callback function
  //   callback(null)
  // }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  // getOn(callback: CharacteristicGetCallback) {
  //   // implement your own code to check if the device is on
  //   const isOn = this.exampleStates.On

  //   this.platform.log.debug('Get Characteristic On ->', isOn)

  //   // you must call the callback function
  //   // the first argument should be null if there were no errors
  //   // the second argument should be the value to return
  //   callback(null, isOn)
  // }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  // setBrightness(
  //   value: CharacteristicValue,
  //   callback: CharacteristicSetCallback,
  // ) {
  //   // implement your own code to set the brightness
  //   this.exampleStates.Brightness = value as number

  //   this.platform.log.debug('Set Characteristic Brightness -> ', value)

  //   // you must call the callback function
  //   callback(null)
  // }
}
