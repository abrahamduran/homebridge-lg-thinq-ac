import type { Service, Characteristic } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = number /** 0-100; 0 is "off" */

type ApiValue = 2 | 4 | 6 | 8 /** 2=low, 4=mid, 6=high, 8=auto */

export default class RotationSpeedCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.RotationSpeed
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
      platform.Characteristic.RotationSpeed,
      'Set',
      'airState.windStrength',
    )

    service
      .getCharacteristic(this.characteristic)
      // If Homekit notices a 0 value, it also sends Active = 0 to shut it off.
      .setProps({ minStep: 25 })
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    switch (apiValue) {
      case 2:
        return 25
      case 4:
        return 50
      case 6:
        return 75
      case 8:
        return 100
    }
  }

  getApiValueFromState(state: State): ApiValue {
    switch (true) {
      case state > 0 && state <= 25:
        return 2
      case state > 25 && state <= 50:
        return 4
      case state > 0 && state <= 75:
        return 6
      case state > 75:
        return 8
    }

    return 8
  }
}
