declare const currencyZero = 0;
type Currency = typeof currencyZero;
type RelationProperties<T extends Record<string, any>> = {
    [K in keyof T as `${Extract<K, string>}`]: any;
};
type RelationPropertiesTypes<T extends Record<string, any>> = {
    [K in keyof T as `${Extract<K, string>}Type`]: any;
};
type RelationPropertiesWithTypes<T extends Record<string, any>> = RelationProperties<T> & RelationPropertiesTypes<T>;
export declare class Balance implements RelationPropertiesWithTypes<{
    owner: string;
}> {
    owner: string;
    ownerType: string;
    available: Currency;
    amount: Currency;
    lastUpdate: Date;
}
export {};
