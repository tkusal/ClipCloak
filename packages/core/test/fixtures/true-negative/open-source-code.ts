/* eslint-disable */
import { someUtility } from './utils';

export function calculateTotal(items: { price: number }[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const CONSTANT_VALUE = 42;
console.log('Total is', calculateTotal([{ price: 10 }, { price: CONSTANT_VALUE }]));
