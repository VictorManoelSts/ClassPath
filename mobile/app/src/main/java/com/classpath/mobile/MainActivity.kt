package com.classpath.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.classpath.mobile.ui.navigation.ClassPathNavHost
import com.classpath.mobile.ui.theme.ClassPathTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ClassPathTheme {
                ClassPathNavHost()
            }
        }
    }
}
