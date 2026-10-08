package com.lokasyonlakay.app;
import android.content.Context;
import android.print.PrintManager;
import android.print.PrintAttributes;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="AppPrint")
public class AppPrintPlugin extends Plugin {
 @PluginMethod public void print(PluginCall call) {
  getActivity().runOnUiThread(() -> {
   try {
    PrintManager manager=(PrintManager)getActivity().getSystemService(Context.PRINT_SERVICE);
    if(manager==null){call.reject("Impression Android indisponible.");return;}
    manager.print("LOKASYON LAKAY",getBridge().getWebView().createPrintDocumentAdapter("LOKASYON LAKAY"),new PrintAttributes.Builder().build());
    call.resolve();
   }catch(Exception e){call.reject("Impossible d’ouvrir l’impression Android.");}
  });
 }
}
