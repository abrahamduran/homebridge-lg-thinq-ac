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
import SwingModeCharacteristic from './characteristic/swingModeCharacteristic'
import EnergySaverModeSwitchCharacteristic from './characteristic/energySaverModeSwitchCharacteristic'
import JetModeSwitchCharacteristic from './characteristic/jetModeSwitchCharacteristic'

export default function getCharacteristicsForModel_ad(
  model: string,
  platform: HomebridgeLgThinqPlatform,
  deviceService: Service,
  energySaverService: Service,
  jetModeService: Service,
  deviceId: string,
  log: Logger,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<AbstractCharacteristic<any, any, any>> {
  return [
    new ActiveCharacteristic(platform, deviceService, deviceId),
    // TODO: These units (or at least RAC_056905_WW does) support variable-position, not just "all or nothing"
    // new RotationSpeedCharacteristic(platform, service, deviceId, 4),
    new EnergySaverModeSwitchCharacteristic(
      platform,
      energySaverService,
      jetModeService,
      deviceId,
    ),
    new JetModeSwitchCharacteristic(
      platform,
      jetModeService,
      energySaverService,
      deviceId,
    ),
    new CoolingThresholdTemperatureCharacteristic_AD(
      platform,
      deviceService,
      deviceId,
    ),
    new HeatingThresholdTemperatureCharacteristic_AD(
      platform,
      deviceService,
      deviceId,
    ),
    new TargetHeatingCoolingStateCharacteristic_AD(
      platform,
      deviceService,
      deviceId,
    ),
    new CurrentHeaterCoolerStateCharacteristic_AD(
      platform,
      deviceService,
      deviceId,
    ),
    new CurrentTemperatureCharacteristic(platform, deviceService, deviceId),
    new FilterChangeCharacteristic(platform, deviceService, deviceId),
    new FilterLifeCharacteristic(platform, deviceService, deviceId),
    new SwingModeCharacteristic(platform, deviceService, deviceId),
  ]
}
