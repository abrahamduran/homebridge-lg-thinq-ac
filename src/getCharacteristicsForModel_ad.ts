import type { Logger, Service } from 'homebridge'

import type { HomebridgeLgThinqPlatform } from './platform'

import ActiveCharacteristic from './characteristic/activeCharacteristic'
import AbstractCharacteristic from './characteristic/abstractCharacteristic'
import CoolingThresholdTemperatureCharacteristic_AD from './characteristic/coolingThresholdTemperatureCharacteristic_ad'
import HeatingThresholdTemperatureCharacteristic_AD from './characteristic/heatingThresholdTemperatureCharacteristic_ad'
import TargetHeatingCoolingStateCharacteristic_AD from './characteristic/targetHeaterCoolerStateCharacteristic_ad'
import CurrentHeaterCoolerStateCharacteristic_AD from './characteristic/currentHeaterCoolerStateCharacteristic_ad'
import CurrentTemperatureCharacteristic from './characteristic/currentTemperatureCharacteristic'
import FilterChangeCharacteristic from './characteristic/filterChangeCharacteristic'
import FilterLifeCharacteristic from './characteristic/filterLifeCharacteristic'

export default function getCharacteristicsForModel_ad(
  model: string,
  platform: HomebridgeLgThinqPlatform,
  service: Service,
  deviceId: string,
  log: Logger,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<AbstractCharacteristic<any, any, any>> {
  return [
    new ActiveCharacteristic(platform, service, deviceId),
    // TODO: These units (or at least RAC_056905_WW does) support variable-position, not just "all or nothing"
    // new SwingModeCharacteristic(platform, service, deviceId),
    // new RotationSpeedCharacteristic(platform, service, deviceId, 4),
    new CoolingThresholdTemperatureCharacteristic_AD(
      platform,
      service,
      deviceId,
    ),
    new HeatingThresholdTemperatureCharacteristic_AD(
      platform,
      service,
      deviceId,
    ),
    new TargetHeatingCoolingStateCharacteristic_AD(platform, service, deviceId),
    new CurrentHeaterCoolerStateCharacteristic_AD(platform, service, deviceId),
    new CurrentTemperatureCharacteristic(platform, service, deviceId),
    new FilterChangeCharacteristic(platform, service, deviceId),
    new FilterLifeCharacteristic(platform, service, deviceId),
  ]
}
