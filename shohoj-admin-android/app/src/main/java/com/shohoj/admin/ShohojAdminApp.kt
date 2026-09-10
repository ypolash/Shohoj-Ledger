package com.shohoj.admin

import android.app.Application
import com.shohoj.admin.data.api.ApiClient
import com.shohoj.admin.data.repository.AdminRepository

class ShohojAdminApp : Application() {

    lateinit var apiClient: ApiClient
        private set

    lateinit var repository: AdminRepository
        private set

    override fun onCreate() {
        super.onCreate()
        apiClient = ApiClient(this)
        repository = AdminRepository(apiClient)
    }
}
