import { Injectable } from '@nestjs/common';

export enum WeightUnit {
  GRAM = 'g',
  TONNE = 't',
  OUNCE = 'oz',
  POUND = 'lb',
  MILLILITER = 'ml',
  LITER = 'l',
  FLUID_OUNCE = 'fl oz',
  KILOGRAM='kg'
}

@Injectable()
export class UnitConversionsService {
  convertToKilogram(weight: number, unit: string) {
    let kilograms = 0;

    switch (unit) {
      case WeightUnit.GRAM:
        kilograms = weight * 0.001;
        break;
      case WeightUnit.TONNE:
        kilograms = weight * 1000;
        break;
      case WeightUnit.OUNCE:
        kilograms = weight * 0.0283495;
        break;
      case WeightUnit.POUND:
        kilograms = weight * 0.453592;
        break;
      case WeightUnit.MILLILITER:
        kilograms = weight * 0.001; // water-equivalent density
        break;
      case WeightUnit.LITER:
        kilograms = weight * 1; // water-equivalent density
        break;
      case WeightUnit.FLUID_OUNCE:
        kilograms = weight * 0.0295735; // water-equivalent density
        break;
      default:
        console.log('Unknown unit');
    }

    return kilograms;
  }

  convertToTonnes(weight: number, unit: string) {
    let tonnes = 0;

    switch (unit) {
      case WeightUnit.GRAM:
        tonnes = weight * 0.000001; // 1 gram = 0.000001 tonnes
        break;
      case WeightUnit.KILOGRAM:
        tonnes = weight * 0.001; // 1 kilogram = 0.001 tonnes
        break;
      case WeightUnit.OUNCE:
        tonnes = weight * 0.0000283495; // 1 ounce = 0.0000283495 tonnes
        break;
      case WeightUnit.POUND:
        tonnes = weight * 0.000453592; // 1 pound = 0.000453592 tonnes
        break;
      case WeightUnit.MILLILITER:
        tonnes = weight * 0.000001; // water-equivalent density
        break;
      case WeightUnit.LITER:
        tonnes = weight * 0.001; // water-equivalent density
        break;
      case WeightUnit.FLUID_OUNCE:
        tonnes = weight * 0.0000295735; // water-equivalent density
        break;
      default:
        console.log('Unknown unit');
    }

    return tonnes;
  }

  /**
   * Convert any supported weight/volume unit to kilograms.
   * Handles the 'kg' identity case (returns amount unchanged) before
   * delegating to convertToKilogram, which does not include a kg → kg case.
   */
  toKg(amount: number, unit: string): number {
    return unit === 'kg' ? amount : this.convertToKilogram(amount, unit);
  }

  /**
   * Convert any supported weight/volume unit to metric tonnes.
   * Volume-only units (ml, l, fl oz) return 0 — use toL() for those instead.
   */
  toTonnes(amount: number, unit: string): number {
    return this.convertToTonnes(amount, unit);
  }

  /**
   * Returns true when the unit is a volume unit (ml, l, fl oz).
   * Use this to branch between weight-based (metric ton*km) and
   * volume-based (l*km) transport freight calculations.
   */
  isVolumeUnit(unit: string): boolean {
    return (
      unit === WeightUnit.MILLILITER ||
      unit === WeightUnit.LITER ||
      unit === WeightUnit.FLUID_OUNCE
    );
  }

  /**
   * Convert a volume unit to litres.
   *   ml      → 0.001 l
   *   l       → 1 l
   *   fl oz   → 0.0295735 l
   * Returns 0 for non-volume units.
   */
  toL(amount: number, unit: string): number {
    switch (unit) {
      case WeightUnit.MILLILITER:
        return amount * 0.001;
      case WeightUnit.LITER:
        return amount;
      case WeightUnit.FLUID_OUNCE:
        return amount * 0.0295735;
      default:
        return 0;
    }
  }

  /**
   * Convert a number to a plain decimal string (avoids scientific notation).
   * Always returns a string for valid numbers; returns the input unchanged
   * for null/undefined/non-finite/non-number values.
   */
  toDecimalString(n: any): any {
    if (n == null || typeof n !== 'number' || !isFinite(n)) return n;
    if (!/e/i.test(String(n))) return String(n);
    const [mantissa, expStr] = String(n).split(/e/i);
    const exp = parseInt(expStr, 10);
    const sign = mantissa.startsWith('-') ? '-' : '';
    const absMantissa = mantissa.replace(/^-/, '');
    const [intPart, decPart = ''] = absMantissa.split('.');
    const digits = intPart + decPart;
    const decimalPos = intPart.length + exp;
    if (decimalPos <= 0) {
      return (
        sign + '0.' + '0'.repeat(-decimalPos) + digits.replace(/0+$/, '')
      );
    }
    if (decimalPos >= digits.length) {
      return sign + digits + '0'.repeat(decimalPos - digits.length);
    }
    const intResult = digits.slice(0, decimalPos);
    const decResult = digits.slice(decimalPos).replace(/0+$/, '');
    return sign + intResult + (decResult ? '.' + decResult : '');
  }
}
