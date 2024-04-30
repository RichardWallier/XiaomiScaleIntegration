type PeopleType = 0 | 1 | 2;
export type SexType = 0 | 1;

export interface BodyData {
    age: number;
    sex: 0 | 1;
    height: number;
    weight: number;
    bmi: number;
    bodyfatPercentage: number;
    boneMass: number;
    muscleMass: number;
    waterPercentage: number;
    bmr: number;
    date: Date;
    // vfal: number;
}

export const initialBodyData: BodyData = {
    age: 0,
    sex: 0,
    height: 0,
    bmi: 0,
    weight: 0,
    bodyfatPercentage: 0,
    boneMass: 0,
    muscleMass: 0,
    waterPercentage: 0,
    bmr: 0,
    date: new Date()
    // vfal: 0,
}

export interface ScaleFilter {
    scaleName: string,
    serviceUUID: string | number,
    characteristicWriteUUID: string | number,
    characteristicNofifyUUID: string | number,
    advDataLength: Number,
    advDataType: Number,
    historyDataLength: Number,
    historyEndDataLength: Number,
    beaconBytesLenght: Number,
}

export class MiScaleLib {
    private sex: SexType; // male = 1; female = 0
    private age: number;
    private height: number;

    public constructor(sex: SexType, age: number, height: number) {
        this.sex = sex;
        this.age = age;
        this.height = height;
    }

    private getLBMCoefficient(weight: number, impedance: number) {
        let lbm =  (this.height * 9.058 / 100.0) * (this.height / 100.0);
        lbm += weight * 0.32 + 12.226;
        lbm -= impedance * 0.0068;
        lbm -= this.age * 0.0542;

        return lbm;
    }

    public getBMI(weight: number) {
        return weight / (((this.height * this.height) / 100.0) / 100.0);
    }

    public getLBM(weight: number, impedance: number) {
        let leanBodyMass = weight - ((this.getBodyFat(weight, impedance) * 0.01) * weight) - this.getBoneMass(weight, impedance);

        if (this.sex == 0 && leanBodyMass >= 84.0) {
            leanBodyMass = 120.0;
        }
        else if (this.sex == 1 && leanBodyMass >= 93.5) {
            leanBodyMass = 120.0;
        }
        return leanBodyMass;
    }

    public getMuscle(weight: number, impedance: number) {
        return this.getLBM( weight, impedance); // this is wrong but coherent with MiFit app behaviour
    }

    public getWater(weight: number, impedance: number) {
        let coeff;
        let water = (100.0 - this.getBodyFat(weight, impedance)) * 0.7;

        if (water < 50) {
            coeff = 1.02;
        } else {
            coeff = 0.98;
        }
        
        return coeff * water;
    }

    public getBoneMass(weight: number, impedance: number) {
        let boneMass;
        let base;

        if (this.sex == 0) {
            base = 0.245691014;
        }
        else {
            base = 0.18016894;
        }

        boneMass = (base - (this.getLBMCoefficient(weight, impedance) * 0.05158)) * -1.0;

        if (boneMass > 2.2) {
            boneMass += 0.1;
        }
        else {
            boneMass -= 0.1;
        }

        if (this.sex == 0 && boneMass > 5.1) {
            boneMass = 8.0;
        }
        else if (this.sex == 1 && boneMass > 5.2) {
            boneMass = 8.0;
        }
            
        return boneMass;
    }

    public getVisceralFat(weight: number) {
        let visceralFat = 0.0;
        if (this.sex == 0) {
            if (weight > (13.0 - (this.height * 0.5)) * -1.0) {
                let subsubcalc = ((this.height * 1.45) + (this.height * 0.1158) * this.height) - 120.0;
                let subcalc = weight * 500.0 / subsubcalc;
                visceralFat = (subcalc - 6.0) + (this.age * 0.07);
            }
            else {
                let subcalc = 0.691 + (this.height * -0.0024) + (this.height * -0.0024);
                visceralFat = (((this.height * 0.027) - (subcalc * weight)) * -1.0) + (this.age * 0.07) - this.age;
            }
        }
        else {
            if (this.height < weight * 1.6) {
                let subcalc = ((this.height * 0.4) - (this.height * (this.height * 0.0826))) * -1.0;
                visceralFat = ((weight * 305.0) / (subcalc + 48.0)) - 2.9 + (this.age * 0.15);
            }
            else {
                let subcalc = 0.765 + this.height * -0.0015;
                visceralFat = (((this.height * 0.143) - (weight * subcalc)) * -1.0) + (this.age * 0.15) - 5.0;
            }
        }

        return visceralFat;
    }

    public getBodyFat(weight: number, impedance: number) {
        let bodyFat = 0.0;
        let lbmSub = 0.8;

        if (this.sex == 0 && this.age <= 49) {
            lbmSub = 9.25;
        } else if (this.sex == 0 && this.age > 49) {
            lbmSub = 7.25;
        }

        let lbmCoeff = this.getLBMCoefficient(weight, impedance);
        let coeff = 1.0;

        if (this.sex == 1 && weight < 61.0) {
            coeff = 0.98;
        }
        else if (this.sex == 0 && weight > 60.0) {
            coeff = 0.96;

            if (this.height > 160.0) {
                coeff *= 1.03;
            }
        } else if (this.sex == 0 && weight < 50.0) {
            coeff = 1.02;

            if (this.height > 160.0) {
                coeff *= 1.03;
            }
        }

        bodyFat = (1.0 - (((lbmCoeff - lbmSub) * coeff) / weight)) * 100.0;

        if (bodyFat > 63.0) {
            bodyFat = 75.0;
        }
        return bodyFat;
    }
}