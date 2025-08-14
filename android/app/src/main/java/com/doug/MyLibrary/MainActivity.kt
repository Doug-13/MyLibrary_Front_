package com.doug.MyLibrary

import com.facebook.react.ReactActivity
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "MyLibrary"

  override fun createReactActivityDelegate() =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
