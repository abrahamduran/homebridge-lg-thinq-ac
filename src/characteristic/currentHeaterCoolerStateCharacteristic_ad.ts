import type { Service, Characteristic } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State =
  | typeof Characteristic.CurrentHeaterCoolerState.INACTIVE
  | typeof Characteristic.CurrentHeaterCoolerState.IDLE
  | typeof Characteristic.CurrentHeaterCoolerState.COOLING
  | typeof Characteristic.CurrentHeaterCoolerState.HEATING

type ApiValue = 0 | 1 | 2 | 3

export default class CurrentHeaterCoolerStateCharacteristic_AD extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.CurrentHeaterCoolerState
> {

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
  ) {
    super(
      platform,
      service,
      deviceId,
      platform.Characteristic.CurrentHeaterCoolerState,
      'Set',
      'airState.opMode',
    )
  }

  handleSet = undefined

  getStateFromApiValue(apiValue: ApiValue): State {
    this.logDebug('AD: API Value', apiValue)
    switch (apiValue) {
      case 0:
      case 1:
        return this.characteristic.COOLING
        // return this.characteristic.HEATING
      case 2:
        return this.characteristic.INACTIVE
      case 3:
        return this.characteristic.IDLE
    }
  }

  getApiValueFromState(state: State): ApiValue {
    this.logDebug('AD: State', state)
    switch (state) {
      case this.characteristic.COOLING:
        return 0
      case this.characteristic.HEATING:
        return 0
      case this.characteristic.INACTIVE:
        return 2
      case this.characteristic.IDLE:
        return 3
    }
  }
}
