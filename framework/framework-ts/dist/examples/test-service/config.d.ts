import { PropertyDefinitionSpecification } from '@live-change/framework';
interface BalanceServiceConfig<T> {
    currencyType: PropertyDefinitionSpecification;
    currencyAdd: (...args: T[]) => T;
    currencyNegate: (value: T) => T;
    currencyIsPositive: (value: T) => boolean;
    changePossible: (value: T, change: T) => boolean;
    nextRecalculateTime: (value: T) => T | null;
    recalculate: (value: T, time: T) => T;
    readerRoles: string[];
    currencyZero: T;
    createBalanceIfNotExists: boolean;
}
declare const config: BalanceServiceConfig<number>;
export default config;
