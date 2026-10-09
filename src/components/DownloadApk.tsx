import {Capacitor} from '@capacitor/core';

const apkUrl='https://github.com/richesman25-beep/application-web-pour-location/releases/download/v1.0.0/LOKASYON-LAKAY-test.3.apk';

export function DownloadApk(){
 if(Capacitor.isNativePlatform()||!(/Android/i.test(navigator.userAgent)))return null;
 return <section className="apk-download no-print" aria-label="Application Android">
  <a className="primary" href={apkUrl} download="LOKASYON-LAKAY-test.3.apk" target="_blank" rel="noopener noreferrer">
   <svg className="apk-android-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="m7 4-2-3m12 3 2-3M5 10a7 7 0 0 1 14 0H5Z"/>
    <circle cx="9" cy="7" r=".6" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r=".6" fill="currentColor" stroke="none"/>
    <path d="M5 12h14v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6ZM2 12v6m20-6v6M9 20v3m6-3v3"/>
   </svg>
   <span>Télécharger l'application Android</span>
  </a>
  <p>Version de test · Android 7 ou plus récent</p>
  <details><summary>Comment installer l’APK ?</summary><p>Ouvrez le fichier téléchargé sur votre téléphone Android. Si Android le demande, autorisez l’installation depuis votre navigateur, puis appuyez sur « Installer ».</p></details>
 </section>;
}
