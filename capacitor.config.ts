import type {CapacitorConfig} from '@capacitor/cli';
const config:CapacitorConfig={appId:'com.lokasyonlakay.app',appName:'LOKASYON LAKAY',webDir:'dist-android',server:{androidScheme:'https'},android:{allowMixedContent:false,webContentsDebuggingEnabled:false,backgroundColor:'#f4f7fc'},plugins:{SystemBars:{insetsHandling:'native',style:'LIGHT'}}};
export default config;
