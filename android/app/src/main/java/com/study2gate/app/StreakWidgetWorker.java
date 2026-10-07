package com.study2gate.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

// Runs in the background (scheduled by StreakWidgetProvider) to fetch the
// real streak and push it into every placed instance of the widget.
// Talks to the same Vercel-proxied origin the WebView itself uses (see
// capacitor.config.ts server.url and src/api/api.js), so it hits the
// identical backend the logged-in app does, just outside the WebView.
public class StreakWidgetWorker extends Worker {

    private static final String BASE_URL = "https://study-2gate.vercel.app";
    private static final String STREAK_ENDPOINT = BASE_URL + "/api/widget/streak";

    public StreakWidgetWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();

        SharedPreferences prefs = context.getSharedPreferences(
                WidgetTokenPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        String token = prefs.getString(WidgetTokenPlugin.KEY_TOKEN, null);

        if (token == null || token.isEmpty()) {
            // Not logged in on this device yet (or logged out) — nothing
            // to fetch. Not a failure; just nothing to do right now.
            return Result.success();
        }

        try {
            String responseBody = fetchStreak(token);
            JSONObject root = new JSONObject(responseBody);

            if (!root.optBoolean("success", false)) {
                // Token likely expired/invalid server-side. Don't keep
                // retrying forever on a token that will never work again —
                // it gets refreshed naturally on the user's next login.
                return Result.success();
            }

            JSONObject streak = root.getJSONObject("streak");
            int currentStreak = streak.optInt("currentStreak", 0);
            String status = streak.optString("status", "none");

            updateAllWidgets(context, currentStreak, status);
            return Result.success();

        } catch (Exception e) {
            // Network hiccup, timeout, etc. — let WorkManager retry with
            // its default backoff rather than silently giving up.
            return Result.retry();
        }
    }

    private String fetchStreak(String token) throws Exception {
        URL url = new URL(STREAK_ENDPOINT);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        try {
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Authorization", "Bearer " + token);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(15000);

            int code = connection.getResponseCode();
            InputStream stream = (code >= 200 && code < 300)
                    ? connection.getInputStream()
                    : connection.getErrorStream();

            StringBuilder result = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    result.append(line);
                }
            }
            return result.toString();
        } finally {
            connection.disconnect();
        }
    }

    private void updateAllWidgets(Context context, int currentStreak, String status) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, StreakWidgetProvider.class);
        int[] widgetIds = manager.getAppWidgetIds(provider);

        String reminderText = reminderFor(status);

        for (int widgetId : widgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak);
            views.setTextViewText(R.id.widget_streak_text, String.valueOf(currentStreak));
            views.setTextViewText(R.id.widget_reminder_text, reminderText);
            manager.partiallyUpdateAppWidget(widgetId, views);
        }
    }

    // Mirrors backend/controllers/streakController.js status values.
    private String reminderFor(String status) {
        switch (status) {
            case "safe":
                return "Streak safe. Nice work today.";
            case "pending":
                return "Study today to keep your streak.";
            case "at_risk":
                return "Your streak ends tonight. Study now.";
            case "broken":
            case "none":
            default:
                return "Start a new streak today.";
        }
    }
}
