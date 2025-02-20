import type * as hb from "homebridge";
import miio from "miio-api";
import { DeviceOptions, PlatformAccessory } from "../platform";
import {
  HumidifierModel,
  HumidifierConfigFunc,
  HumidifierFactory,
} from "./models";
import { features } from "./features";
import { BaseHumidifier } from "./humidifier";
import { Logger } from "./logger";

/**
 * Partial miIO.info call result.
 */
export type DeviceInfo = {
  model: string;
  mac: string;
  fw_ver: string;
  hw_ver: string;
};

export async function createHumidifier(
  name: string,
  address: string,
  token: string,
  model: HumidifierModel,
  options: DeviceOptions,
  api: hb.API,
  log: hb.Logging,
): Promise<Humidifier> {
  const device = await miio.device({
    address: address,
    token: token,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let configFunc: HumidifierConfigFunc<any>;

  if (model in HumidifierFactory) {
    configFunc = HumidifierFactory[model];
  } else {
    throw new HumidifierError(`Unsupported humidifier model "${model}"`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feat = features<any>(api.hap.Service, api.hap.Characteristic, log);

  const { protocol, features: feats } = configFunc(device, feat, log, options);

  return new BaseHumidifier(
    api,
    protocol,
    [...feat.accessoryInfo(name, model, device.id), ...feats],
    new Logger(log, `[${address}] `),
    options,
  );
}

export interface Humidifier {
  configureAccessory(accessory: PlatformAccessory): void;
  update(): Promise<void>;
}

export class HumidifierError extends Error {
  public cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);

    this.cause = cause;
  }
}
