import dotenv from 'dotenv';
dotenv.config();
import App from "@live-change/framework";
const app = App.app();
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { accessSync, readFileSync } from 'fs';
const packageJsonPath = dirname(fileURLToPath(import.meta.url))
    .split('/').map((part, i, arr) => join(arr.slice(0, arr.length - i).join('/'), 'package.json')).find(p => { try {
    accessSync(p);
    return true;
}
catch (e) {
    return false;
} });
const packageJson = packageJsonPath ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) : {};
const name = packageJson.name ?? "Example";
const brandName = process.env.BRAND_NAME || (name[0].toUpperCase() + name.slice(1));
const homepage = process.env.BASE_HREF ?? packageJson.homepage;
const brandDomain = process.env.BRAND_DOMAIN ||
    (homepage && homepage.match(/https\:\/\/([^\/]+)/)?.[1]) || 'example.com';
const baseHref = process.env.BASE_HREF || homepage || 'http://localhost:8001';
const version = process.env.VERSION || packageJson.version;
const clientConfig = {
    version,
    name, brandName, brandDomain, homepage, baseHref
};
const baseAppConfig = {
    ...clientConfig,
    clientConfig: { ...clientConfig },
};
const contactTypes = ['email', 'phone'];
const remoteAccountTypes = ['google', 'linkedin'];
import securityConfig from './security.config.js';
app.config = {
    ...baseAppConfig,
    clientConfig: {
        ...baseAppConfig.clientConfig,
    },
    services: [
        {
            name: 'timer',
            path: '@live-change/timer-service'
        },
        {
            name: 'session',
            path: '@live-change/session-service',
            createSessionOnUpdate: true
        },
        {
            name: 'user',
            path: '@live-change/user-service',
            remoteAccountTypes
        },
        {
            name: 'email',
            path: '@live-change/email-service'
        },
        {
            name: 'phone',
            path: '@live-change/phone-service'
        },
        {
            name: 'secretLink',
            path: '@live-change/secret-link-service'
        },
        {
            name: 'secretCode',
            path: '@live-change/secret-code-service'
        },
        {
            name: 'messageAuthentication',
            path: '@live-change/message-authentication-service',
            contactTypes,
            signUp: true,
            signIn: true,
            connect: true
        },
        {
            name: 'passwordAuthentication',
            path: '@live-change/password-authentication-service',
            contactTypes,
            signInWithoutPassword: true
        },
        {
            name: 'googleAuthentication',
            path: '@live-change/google-authentication-service',
        },
        {
            name: 'linkedinAuthentication',
        },
        {
            name: 'security',
            path: '@live-change/security-service',
            ...securityConfig
        },
        {
            name: 'userIdentification',
            path: '@live-change/user-identification-service'
        },
        {
            name: 'identicon',
            path: '@live-change/identicon-service'
        },
        {
            name: 'localeSettings'
        },
        {
            name: 'notification',
            path: '@live-change/notification-service',
            contactTypes,
            notificationTypes: ['example_TestNotification']
        },
        {
            name: 'upload',
            path: '@live-change/upload-service'
        },
        {
            name: 'geoIp',
            geoIpCountryPath: 'geoip/GeoLite2-Country.mmdb',
            geoIpDefaultCountry: 'PL'
        },
        {
            name: 'image',
            path: '@live-change/image-service'
        },
        /*    {
              name: 'backup',
              path: '@live-change/backup-service',
              clearEvents: true
            }*/
        //  { path: '@live-change/google-account-service' },
    ]
};
export default app.config;
