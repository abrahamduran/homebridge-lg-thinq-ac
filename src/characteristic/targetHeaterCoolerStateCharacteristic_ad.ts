import type { Service, Characteristic, CharacteristicValue, CharacteristicSetCallback, CharacteristicProps } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State =
  | typeof Characteristic.TargetHeaterCoolerState.COOL
  | typeof Characteristic.TargetHeaterCoolerState.HEAT
  | typeof Characteristic.TargetHeaterCoolerState.AUTO

type ApiValue = 0 | 1 | 2 | 3

// const COOLING_TARGET_PROPS: Partial<CharacteristicProps> = { minValue: 18, maxValue: 30, minStep: 1 }
// const HEATING_TARGET_PROPS: Partial<CharacteristicProps> = { minValue: 21, maxValue: 25, minStep: 1 }
// const AUTO_TARGET_PROPS: Partial<CharacteristicProps> = { minValue: 15, maxValue: 19, minStep: 1 }

export default class TargetHeaterCoolerStateCharacteristic_AD extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.TargetHeaterCoolerState
> {
  localPlatform: HomebridgeLgThinqPlatform
  localService: Service

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
  ) {
    super(
      platform,
      service,
      deviceId,
      platform.Characteristic.TargetHeaterCoolerState,
      'Set',
      'airState.opMode',
    )

    this.localPlatform = platform
    this.localService = service

    this.logWarning(
      'Warning: Your model may support a "drying" or "dehumidification" mode. ' +
        'This is NOT natively supported by Homekit, and using it may show errors in Homebridge or cause temporary instability.',
    )
  }

  // handleSet?(value: CharacteristicValue, callback: CharacteristicSetCallback) {
  //   const targetState = this.getStateFromApiValue(
  //     this.getApiValueFromState(value as State),
  //   )

  //   switch (targetState) {
  //     case this.characteristic.COOL:
  //       this.localService
  //         .getCharacteristic(this.localPlatform.Characteristic.CoolingThresholdTemperature)
  //         .setProps(COOLING_TARGET_PROPS)
  //         this.logDebug('Setting Cooling Props', COOLING_TARGET_PROPS)
  //       break;

  //     case this.characteristic.HEAT:
  //       this.localService
  //         .getCharacteristic(this.localPlatform.Characteristic.HeatingThresholdTemperature)
  //         .setProps(HEATING_TARGET_PROPS)
  //         this.logDebug('Setting Heating Props', HEATING_TARGET_PROPS)
  //       break;

  //     case this.characteristic.AUTO:
  //       this.localService
  //         .getCharacteristic(this.localPlatform.Characteristic.CoolingThresholdTemperature)
  //         .setProps(AUTO_TARGET_PROPS)
  //         this.logDebug('Setting Auto Props', AUTO_TARGET_PROPS)
  //       break;
  //   }

  //   if (super.handleSet) {
  //     super.handleSet(value, callback)
  //   }
  // }

  getStateFromApiValue(apiValue: ApiValue): State {
    this.logDebug('AD: API Value', apiValue)
    switch (apiValue) {
      case 0:
        return this.characteristic.COOL
      case 1:
        return this.characteristic.HEAT
      case 2:
        return this.characteristic.AUTO
      case 3:
        return this.characteristic.AUTO
    }
  }

  getApiValueFromState(state: State): ApiValue {
    this.logDebug('AD: State', state)
    switch (state) {
      case this.characteristic.COOL:
        return 0
      case this.characteristic.HEAT:
        return 1
      case this.characteristic.AUTO:
        return 3
    }
  }
}
