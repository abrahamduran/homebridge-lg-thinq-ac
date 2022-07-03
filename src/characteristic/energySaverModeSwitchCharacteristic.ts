import {
  Characteristic,
  CharacteristicSetCallback,
  CharacteristicValue,
  Service,
} from 'homebridge'
import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = boolean

type ApiValue = 0 | 1

export default class EnergySaverModeSwitchCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.On
> {
  localPlatform: HomebridgeLgThinqPlatform
  jetModeService: Service

  constructor(
    platform: HomebridgeLgThinqPlatform,
    energySaverService: Service,
    jetModeService: Service,
    deviceId: string,
  ) {
    super(
      platform,
      energySaverService,
      deviceId,
      platform.Characteristic.On,
      'Set',
      'airState.powerSave.basic',
    )

    energySaverService.setCharacteristic(
      platform.Characteristic.Name,
      'Energy Saver Switch',
    )

    this.localPlatform = platform
    this.jetModeService = jetModeService
  }

  handleSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const targetState = this.getStateFromApiValue(
      this.getApiValueFromState(value as State),
    )

    if (targetState) {
      this.jetModeService.updateCharacteristic(
        this.localPlatform.Characteristic.On,
        false,
      )
    }

    if (super.handleSet) {
      super.handleSet(value, callback)
    }
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    return apiValue > 0
  }

  getApiValueFromState(state: State): ApiValue {
    return state ? 1 : 0
  }
}
