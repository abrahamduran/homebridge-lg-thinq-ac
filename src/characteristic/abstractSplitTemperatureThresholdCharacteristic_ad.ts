import type { Service, Characteristic, CharacteristicProps } from 'homebridge'
import type { GetDeviceResponse } from '../thinq/apiTypes'
import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = number /** temperature in celcius */

type ApiValue = number /** temperature in celcius */

type Mode = 'cool' | 'heat'

// const COOLING_TARGET_PROPS: Partial<CharacteristicProps> = { minValue: 18, maxValue: 30, minStep: 1 }
// const HEATING_TARGET_PROPS: Partial<CharacteristicProps> = { minValue: 21, maxValue: 25, minStep: 1 }
// const AUTO_TARGET_PROPS: Partial<CharacteristicProps> = { minValue: 15, maxValue: 19, minStep: 1 }

/**
 * The air conditioner will report a single API "target temperature", while Homekit
 * supports a target temperature for both heat & cool simultaneously.
 * To support this, we still emit two characteristics, but only accept "set" commands
 * depending on the current targetState of the appliance.
 */
export default class AbstractSplithresholdCharacteristic_AD extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.CoolingThresholdTemperature
> {
  mode: Mode
  localPlatform: HomebridgeLgThinqPlatform
  localService: Service

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
    mode: Mode,
  ) {
    super(
      platform,
      service,
      deviceId,
      mode === 'cool'
        ? platform.Characteristic.CoolingThresholdTemperature
        : platform.Characteristic.HeatingThresholdTemperature,
      'Set',
      'airState.tempState.target',
    )
    this.mode = mode
    service
      .getCharacteristic(this.characteristic)
      // min/max as defined in product manual
      .setProps({ minValue: 17, maxValue: 30, minStep: 1 })
    // Usually these would be private, but this is a special characteristic
    // that needs these
    this.localPlatform = platform
    this.localService = service
  }

  // Override default handleUpdatedSnapshot() to ignore based on mode
  handleUpdatedSnapshot(snapshot: GetDeviceResponse['result']['snapshot']) {
    const targetState = this.localService.getCharacteristic(
      this.localPlatform.Characteristic.TargetHeaterCoolerState,
    ).value
    const requiredState =
      this.mode === 'cool'
        ? this.localPlatform.Characteristic.TargetHeaterCoolerState.COOL
        : this.localPlatform.Characteristic.TargetHeaterCoolerState.HEAT
    if (targetState !== requiredState) {
      this.logDebug(
        `Target state is not "${this.mode}", ignoring snapshot update`,
      )
    }

    // switch (targetState) {
    //   case this.localPlatform.Characteristic.TargetHeaterCoolerState.COOL:
    //     this.localService
    //       .getCharacteristic(this.characteristic)
    //       .setProps(COOLING_TARGET_PROPS)

    //     this.logDebug('Setting Cooling Props', COOLING_TARGET_PROPS)
    //     break

    //   case this.localPlatform.Characteristic.TargetHeaterCoolerState.HEAT:
    //     this.localService
    //       .getCharacteristic(this.characteristic)
    //       .setProps(HEATING_TARGET_PROPS)
    //     this.logDebug('Setting Heating Props', HEATING_TARGET_PROPS)
    //     break

    //   case this.localPlatform.Characteristic.TargetHeaterCoolerState.AUTO:
    //     this.localService
    //       .getCharacteristic(this.characteristic)
    //       .setProps(AUTO_TARGET_PROPS)
    //     this.logDebug('Setting Auto Props', AUTO_TARGET_PROPS)
    //     break

    //   default:
    //     break
    // }

    super.handleUpdatedSnapshot(snapshot)
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    return apiValue
  }

  getApiValueFromState(state: State): ApiValue {
    return state
  }
}
