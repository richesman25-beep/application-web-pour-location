import {Capacitor} from '@capacitor/core';
import {Download} from 'lucide-react';

const apkUrl='https://github.com/richesman25-beep/application-web-pour-location/raw/refs/heads/feature/android-apk/downloads/LOKASYON-LAKAY-test.apk';

export function DownloadApk(){
 if(Capacitor.isNativePlatform()||!(/Android/i.test(navigator.userAgent)))return null;
 return <section className="apk-download no-print" aria-label="Application Android">
  <a className="primary" href={apkUrl} download="LOKASYON-LAKAY-test.apk" target="_blank" rel="noopener noreferrer"><Download size={18} aria-hidden="true"/>Télécharger pour Android (.apk)</a>
  <p>Version de test · Android 6 ou plus récent · 9,1 Mo</p>
  <details><summary>Comment installer l’APK ?</summary><p>Ouvrez le fichier téléchargé sur votre téléphone Android. Si Android le demande, autorisez l’installation depuis votre navigateur, puis appuyez sur « Installer ».</p></details>
 </section>;
}
