export default app.config;
declare namespace config {
    namespace clientConfig {
        export { version };
        export { name };
        export { brandName };
        export { brandDomain };
        export { homepage };
        export { baseHref };
    }
    let services: ({
        name: string;
        path: string;
        createSessionOnUpdate?: undefined;
        remoteAccountTypes?: undefined;
        contactTypes?: undefined;
        signUp?: undefined;
        signIn?: undefined;
        connect?: undefined;
        signInWithoutPassword?: undefined;
        notificationTypes?: undefined;
        geoIpCountryPath?: undefined;
        geoIpDefaultCountry?: undefined;
    } | {
        name: string;
        path: string;
        createSessionOnUpdate: boolean;
        remoteAccountTypes?: undefined;
        contactTypes?: undefined;
        signUp?: undefined;
        signIn?: undefined;
        connect?: undefined;
        signInWithoutPassword?: undefined;
        notificationTypes?: undefined;
        geoIpCountryPath?: undefined;
        geoIpDefaultCountry?: undefined;
    } | {
        name: string;
        path: string;
        remoteAccountTypes: string[];
        createSessionOnUpdate?: undefined;
        contactTypes?: undefined;
        signUp?: undefined;
        signIn?: undefined;
        connect?: undefined;
        signInWithoutPassword?: undefined;
        notificationTypes?: undefined;
        geoIpCountryPath?: undefined;
        geoIpDefaultCountry?: undefined;
    } | {
        name: string;
        path: string;
        contactTypes: string[];
        signUp: boolean;
        signIn: boolean;
        connect: boolean;
        createSessionOnUpdate?: undefined;
        remoteAccountTypes?: undefined;
        signInWithoutPassword?: undefined;
        notificationTypes?: undefined;
        geoIpCountryPath?: undefined;
        geoIpDefaultCountry?: undefined;
    } | {
        name: string;
        path: string;
        contactTypes: string[];
        signInWithoutPassword: boolean;
        createSessionOnUpdate?: undefined;
        remoteAccountTypes?: undefined;
        signUp?: undefined;
        signIn?: undefined;
        connect?: undefined;
        notificationTypes?: undefined;
        geoIpCountryPath?: undefined;
        geoIpDefaultCountry?: undefined;
    } | {
        name: string;
        path?: undefined;
        createSessionOnUpdate?: undefined;
        remoteAccountTypes?: undefined;
        contactTypes?: undefined;
        signUp?: undefined;
        signIn?: undefined;
        connect?: undefined;
        signInWithoutPassword?: undefined;
        notificationTypes?: undefined;
        geoIpCountryPath?: undefined;
        geoIpDefaultCountry?: undefined;
    } | {
        clientKeys: (client: any) => {
            key: string;
            value: any;
        }[];
        patterns: {
            elements: {};
            relations: {};
        };
        counters: ({
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
        name: string;
        path: string;
        createSessionOnUpdate?: undefined;
        remoteAccountTypes?: undefined;
        contactTypes?: undefined;
        signUp?: undefined;
        signIn?: undefined;
        connect?: undefined;
        signInWithoutPassword?: undefined;
        notificationTypes?: undefined;
        geoIpCountryPath?: undefined;
        geoIpDefaultCountry?: undefined;
    } | {
        name: string;
        path: string;
        contactTypes: string[];
        notificationTypes: string[];
        createSessionOnUpdate?: undefined;
        remoteAccountTypes?: undefined;
        signUp?: undefined;
        signIn?: undefined;
        connect?: undefined;
        signInWithoutPassword?: undefined;
        geoIpCountryPath?: undefined;
        geoIpDefaultCountry?: undefined;
    } | {
        name: string;
        geoIpCountryPath: string;
        geoIpDefaultCountry: string;
        path?: undefined;
        createSessionOnUpdate?: undefined;
        remoteAccountTypes?: undefined;
        contactTypes?: undefined;
        signUp?: undefined;
        signIn?: undefined;
        connect?: undefined;
        signInWithoutPassword?: undefined;
        notificationTypes?: undefined;
    })[];
}
declare const app: any;
declare const version: any;
declare const name: any;
declare const brandName: any;
declare const brandDomain: any;
declare const homepage: any;
declare const baseHref: any;
