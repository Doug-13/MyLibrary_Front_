package com.mylibraryapp

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView // 👈 adicione esta linha

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null) // 👈 necessário para gesture-handler funcionar corretamente
  }

  override fun getMainComponentName(): String = "MyLibraryApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
      override fun createRootView(): com.facebook.react.ReactRootView {
        return RNGestureHandlerEnabledRootView(this@MainActivity) // 👈 ativa gesture-handler
      }
    }
  }
}
