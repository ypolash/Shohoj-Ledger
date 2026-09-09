package com.shohoj.staff.data.api

import android.content.Context
import com.shohoj.staff.data.local.SessionCookieJar
import com.shohoj.staff.data.local.SessionManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class ApiClient(private val context: Context) {

    val sessionManager = SessionManager(context)
    val cookieJar = SessionCookieJar(context)

    private var currentBaseUrl: String = sessionManager.baseUrl
    private var cachedService: ShohojApiService? = null

    private val authHeaderInterceptor = Interceptor { chain ->
        val original = chain.request()
        val requestBuilder = original.newBuilder()

        // Pass authorization token if available
        sessionManager.token?.let { token ->
            requestBuilder.header("Authorization", "Bearer $token")
        }

        // Pass employee identification headers for robust server auth
        sessionManager.employeeId?.let { empId ->
            requestBuilder.header("x-employee-id", empId)
        }
        sessionManager.getEmployee()?.let { emp ->
            requestBuilder.header("x-employee-db-id", emp.id)
            if (sessionManager.employeeId == null) {
                requestBuilder.header("x-employee-id", emp.employeeId)
            }
        }

        requestBuilder.header("Accept", "application/json")
        requestBuilder.header("User-Agent", "ShohojStaff-Android/1.0")

        chain.proceed(requestBuilder.build())
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .cookieJar(cookieJar)
            .addInterceptor(authHeaderInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    fun getService(): ShohojApiService {
        val configuredUrl = sessionManager.baseUrl
        if (cachedService != null && configuredUrl == currentBaseUrl) {
            return cachedService!!
        }

        currentBaseUrl = configuredUrl
        val retrofit = Retrofit.Builder()
            .baseUrl(currentBaseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val service = retrofit.create(ShohojApiService::class.java)
        cachedService = service
        return service
    }

    fun invalidate() {
        cachedService = null
    }
}
