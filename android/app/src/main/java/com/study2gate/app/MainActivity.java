package com.study2gate.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetTokenPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
