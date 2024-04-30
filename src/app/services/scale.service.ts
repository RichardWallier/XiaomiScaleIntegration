import { scan, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { BleClient, dataViewToHexString, RequestBleDeviceOptions, ScanMode, ScanResult } from '@capacitor-community/bluetooth-le';
import { BodyData, initialBodyData, SexType, MiScaleLib } from '../models/Scale';

@Injectable({
  providedIn: 'root'
})

export class ScaleService {
  private readonly services = ["0000fff0-0000-1000-8000-00805f9b34fb"];
  private connectedDevice: string;
  private readonly scanOptions: RequestBleDeviceOptions = {
    services: this.services,
    scanMode: ScanMode.SCAN_MODE_LOW_POWER,
    allowDuplicates: true
  }
  private status: number = -1; // -1 waiting - 0 scanning - 1 locked`
  private bodyData: BodyData;
  private lastAdv: string = '';
  bodyDataSubject = new Subject<BodyData>();

  constructor() {
    this.bodyData = { ...initialBodyData };
    this.connectedDevice = "";
  }

  async initBLE() {
    await BleClient.initialize({ androidNeverForLocation: true });
  }

  async searchDevice(sex: SexType, height: number, age: number, devicesList?: string[]) {
    this.status = 0; 
    await BleClient.requestLEScan(
      this.scanOptions,
      (scanResult) => {
        if (devicesList && !devicesList.includes(scanResult.device.deviceId)) return;
        // if (!this.connectedDevice) this.connectedDevice = scanResult.device.deviceId;
        // if (this.connectedDevice !== scanResult.device.deviceId) return;
        if (!scanResult.manufacturerData) return;

        // Get the last manufacturerData(bytes sent by scale) almost all times it will have just one manufactured data
        let dataView: DataView;
        Object.entries(scanResult.manufacturerData).forEach((element) => {
          dataView = element[1];
        });

        // Remove whitespaces from byteString
        const receiveData = dataViewToHexString(dataView!).replace(/\s+/g, '',);
        if (receiveData.length < 22) return;

        // Get the last 22 bytes from the scale
        const hexString = receiveData.slice(receiveData.length - 22);
        if (hexString.length === 0) return;


        // Check for repeated advertisement
        if (hexString === this.lastAdv) return;
        this.lastAdv = hexString;

        // Check scale model
        const preStr = hexString.slice(0, 2);
        if (preStr.toUpperCase() !== "CF") return;

        // Get the data from the scale
        const { weight, impedance, lockData } = this.scaleProtocol(hexString);
        // Update scanning state
        this.status = lockData;

        const bodyData = this.calculateBodyData(height, age, sex, weight, impedance);
        this.bodyData = bodyData;
      })
  }

  async stopSearch() {
    this.status = 0;
    this.bodyData = { ...initialBodyData };
    await BleClient.stopLEScan();
  }

  scaleProtocol(hexString: string) {
    const scaleData = {
      impedance: 0,
      weight: 0,
      encryptImpedance: 0,
      lockData: 0
    }

    // Get first impedance
    const impedanceLow = hexString.slice(2, 4);
    const impedanceHigh = hexString.slice(4, 6);
    const impedance = parseInt(impedanceHigh + impedanceLow, 16);
    scaleData.impedance = impedance;

    // Get weight from bytes
    const weightDataLow = hexString.slice(6, 8);
    const weightDataHigh = hexString.substring(8, 10);
    const weightKg = parseInt(weightDataHigh + weightDataLow, 16) / 100;
    scaleData.weight = weightKg;

    // Get impedance from bytes
    const encryptImpedanceLow = hexString.substring(10, 12);
    const encryptImpedanceMid = hexString.substring(12, 14);
    const encryptImpedanceHigh = hexString.substring(14, 16);
    const encryptImpedance = parseInt(encryptImpedanceHigh + encryptImpedanceMid + encryptImpedanceLow, 16);
    scaleData.encryptImpedance = encryptImpedance;

    // lockData is the byte that warning when the weight are locked and impedance was measured
    // lockData == 0 -> measuring
    // lockData == 1 -> finish measure
    const lockData = parseInt(hexString.substring(18, 20), 16);
    scaleData.lockData = lockData

    return scaleData
  }

  calculateBodyData(height: number, age: number, sex: SexType, weight: number, impedance: number) {
    const bodyData = { ...initialBodyData }; //Shallow copy

    
    const miScaleLib = new MiScaleLib(sex, age, height);
    
    bodyData.age = age;
    bodyData.height = height;
    bodyData.sex = sex;
    bodyData.weight = weight;
    bodyData.bmi = miScaleLib.getBMI(weight);
    bodyData.bodyfatPercentage = miScaleLib.getBodyFat(weight, impedance);
    bodyData.boneMass = miScaleLib.getBoneMass(weight, impedance);
    bodyData.muscleMass = miScaleLib.getMuscle(weight, impedance);
    bodyData.waterPercentage = miScaleLib.getWater(weight, impedance);
    bodyData.date = new Date();
    bodyData.bmr = sex === 1
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

    return bodyData;
  }

  getBodyData() {
    return this.bodyData;
  }

  getStatus() {
    return this.status;
  }
}