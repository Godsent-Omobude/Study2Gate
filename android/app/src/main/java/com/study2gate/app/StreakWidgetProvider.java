package com.study2gate.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Constraints;

import java.util.concurrent.TimeUnit;

public class StreakWidgetProvider extends AppWidgetProvider {

    private static final String PERIODIC_WORK_NAME = "streak_widget_periodic_refresh";
    private static final String ONE_TIME_WORK_NAME = "streak_widget_immediate_refresh";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            drawPlaceholder(context, appWidgetManager, appWidgetId);
        }
        // Every system-triggered onUpdate (including the first placement)
        // also asks for a fresh fetch right away, instead of waiting for
        // the next periodic cycle (see updatePeriodMillis in
        // widget_streak_info.xml, which only sets the *outer* cadence).
        requestImmediateRefresh(context);
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        schedulePeriodicRefresh(context);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
        // No widget instances left on any home screen — stop the
        // background job rather than keep polling for no reason.
        WorkManager.getInstance(context).cancelUniqueWork(PERIODIC_WORK_NAME);
    }

    // Shown immediately on placement, before the first real fetch
    // completes. StreakWidgetWorker overwrites this via
    // partiallyUpdateAppWidget as soon as real data arrives.
    private void drawPlaceholder(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak);

        views.setTextViewText(R.id.widget_streak_text, "0");
        views.setTextViewText(R.id.widget_reminder_text, "Loading your streak…");

        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private void requestImmediateRefresh(Context context) {
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(StreakWidgetWorker.class)
                .setConstraints(constraints)
                .build();

        WorkManager.getInstance(context)
                .enqueueUniqueWork(ONE_TIME_WORK_NAME, ExistingWorkPolicy.REPLACE, request);
    }

    private void schedulePeriodicRefresh(Context context) {
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        // 30 minutes is WorkManager's own minimum period for periodic
        // work — matches updatePeriodMillis in widget_streak_info.xml.
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
                StreakWidgetWorker.class, 30, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build();

        WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(PERIODIC_WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request);
    }
}
