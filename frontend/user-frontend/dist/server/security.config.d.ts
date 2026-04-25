declare namespace _default {
    export { clientKeys };
    export { patterns };
    export { counters };
}
export default _default;
declare function clientKeys(client: any): {
    key: string;
    value: any;
}[];
declare const patterns: {
    elements: {};
    relations: {};
};
declare const counters: ({
    id: string;
    match: string[];
    keys: string[];
    max: number;
    duration: string;
    actions: {
        type: string;
        keys: string[];
        ban: {
            type: string;
            actions: string[];
            expire: string;
        };
    }[];
    visible?: undefined;
} | {
    id: string;
    visible: boolean;
    match: string[];
    keys: string[];
    max: number;
    duration: string;
    actions: {
        type: string;
        keys: string[];
        ban: {
            type: string;
            actions: string[];
            expire: string;
        };
    }[];
})[];
