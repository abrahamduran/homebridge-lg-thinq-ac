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

export default class JetModeSwitchCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.On
> {
  localPlatform: HomebridgeLgThinqPlatform
  energySaverService: Service

  constructor(
    platform: HomebridgeLgThinqPlatform,
    jetModeService: Service,
    energySaverService: Service,
    deviceId: string,
  ) {
    super(
      platform,
      jetModeService,
      deviceId,
      platform.Characteristic.On,
      'Set',
      'airState.wMode.jet',
    )

    jetModeService.setCharacteristic(
      platform.Characteristic.Name,
      'Jet Mode Switch',
    )

    this.localPlatform = platform
    this.energySaverService = energySaverService
  }

  handleSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const targetState = this.getStateFromApiValue(
      this.getApiValueFromState(value as State),
    )

    if (targetState) {
      this.energySaverService.updateCharacteristic(
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
