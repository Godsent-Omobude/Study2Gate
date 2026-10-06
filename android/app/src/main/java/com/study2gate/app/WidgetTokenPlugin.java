package com.study2gate.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Bridges the web app's JS to native storage the widget can read.
// Stored separately from Capacitor's own internal storage/cookies —
// those aren't readable from StreakWidgetProvider, which runs outside
// the WebView entirely.
@CapacitorPlugin(name = "WidgetToken")
public class WidgetTokenPlugin extends Plugin {

    public static final String PREFS_NAME = "widget_prefs";
    public static final String KEY_TOKEN = "streak_token";

    @PluginMethod
    public void saveToken(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.isEmpty()) {
            call.reject("token is required");
            return;
        }

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_TOKEN, token).apply();

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    @PluginMethod
    public void clearToken(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(KEY_TOKEN).apply();

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
}
