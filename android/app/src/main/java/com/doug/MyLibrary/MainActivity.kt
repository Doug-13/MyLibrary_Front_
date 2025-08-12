package com.doug.MyLibrary

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.shell.MainReactPackage
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView


class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null) // Necessário para gesture-handler funcionar corretamente
    }

    override fun getMainComponentName(): String = "MyLibraryApp"

    fun getPackages(): List<ReactPackage> {
        return listOf(
            MainReactPackage(),
        
        )
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
            override fun createRootView(): com.facebook.react.ReactRootView {
                return RNGestureHandlerEnabledRootView(this@MainActivity)
            }
        }
    }
}
