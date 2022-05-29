import type { Service } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractSplithresholdCharacteristic_AD from './abstractSplitTemperatureThresholdCharacteristic_ad'

export default class CoolingThresholdCharacteristic_AD extends AbstractSplithresholdCharacteristic_AD {
  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
  ) {
    super(platform, service, deviceId, 'cool')
  }
}
