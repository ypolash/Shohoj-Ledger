package com.shohoj.staff.data.model

import com.google.gson.*
import com.google.gson.annotations.JsonAdapter
import com.google.gson.annotations.SerializedName
import java.lang.reflect.Type

data class TaskChecklistItem(
    @SerializedName("id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("completed") val completed: Boolean = false
)

data class TaskCommentItem(
    @SerializedName("id") val id: String = "",
    @SerializedName("author") val author: String = "Staff",
    @SerializedName("employeeId") val employeeId: String? = null,
    @SerializedName("text") val text: String = "",
    @SerializedName("createdAt") val createdAt: String = ""
)

class TaskChecklistAdapter : JsonDeserializer<TaskChecklist?>, JsonSerializer<TaskChecklist> {
    override fun serialize(
        src: TaskChecklist?,
        typeOfSrc: Type?,
        context: JsonSerializationContext?
    ): JsonElement {
        val obj = JsonObject()
        if (src != null) {
            obj.addProperty("type", src.type)
            val array = JsonArray()
            src.items.forEach { item ->
                val itemObj = JsonObject()
                itemObj.addProperty("id", item.id)
                itemObj.addProperty("title", item.title)
                itemObj.addProperty("completed", item.completed)
                array.add(itemObj)
            }
            obj.add("items", array)

            val commentsArray = JsonArray()
            src.comments.forEach { comment ->
                val cObj = JsonObject()
                cObj.addProperty("id", comment.id)
                cObj.addProperty("author", comment.author)
                if (comment.employeeId != null) cObj.addProperty("employeeId", comment.employeeId)
                cObj.addProperty("text", comment.text)
                cObj.addProperty("createdAt", comment.createdAt)
                commentsArray.add(cObj)
            }
            obj.add("comments", commentsArray)
        }
        return obj
    }

    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): TaskChecklist? {
        if (json == null || json.isJsonNull) return null
        return try {
            if (json.isJsonObject) {
                val obj = json.asJsonObject
                val type = if (obj.has("type") && !obj.get("type").isJsonNull) obj.get("type").asString else "CHECKLIST"
                val items = mutableListOf<TaskChecklistItem>()
                val itemsElem = when {
                    obj.has("items") -> obj.get("items")
                    obj.has("todos") -> obj.get("todos")
                    else -> null
                }
                if (itemsElem != null && itemsElem.isJsonArray) {
                    itemsElem.asJsonArray.forEach { elem ->
                        if (elem.isJsonObject) {
                            val itemObj = elem.asJsonObject
                            items.add(
                                TaskChecklistItem(
                                    id = if (itemObj.has("id") && !itemObj.get("id").isJsonNull) itemObj.get("id").asString else "",
                                    title = if (itemObj.has("title") && !itemObj.get("title").isJsonNull) itemObj.get("title").asString else "",
                                    completed = if (itemObj.has("completed") && !itemObj.get("completed").isJsonNull) itemObj.get("completed").asBoolean else false
                                )
                            )
                        }
                    }
                }

                val comments = mutableListOf<TaskCommentItem>()
                if (obj.has("comments") && obj.get("comments").isJsonArray) {
                    obj.getAsJsonArray("comments").forEach { elem ->
                        if (elem.isJsonObject) {
                            val cObj = elem.asJsonObject
                            comments.add(
                                TaskCommentItem(
                                    id = if (cObj.has("id") && !cObj.get("id").isJsonNull) cObj.get("id").asString else "",
                                    author = if (cObj.has("author") && !cObj.get("author").isJsonNull) cObj.get("author").asString else "Staff",
                                    employeeId = if (cObj.has("employeeId") && !cObj.get("employeeId").isJsonNull) cObj.get("employeeId").asString else null,
                                    text = if (cObj.has("text") && !cObj.get("text").isJsonNull) cObj.get("text").asString else "",
                                    createdAt = if (cObj.has("createdAt") && !cObj.get("createdAt").isJsonNull) cObj.get("createdAt").asString else ""
                                )
                            )
                        }
                    }
                }

                TaskChecklist(type = type, items = items, comments = comments)
            } else if (json.isJsonArray) {
                val items = mutableListOf<TaskChecklistItem>()
                json.asJsonArray.forEach { elem ->
                    if (elem.isJsonObject) {
                        val itemObj = elem.asJsonObject
                        items.add(
                            TaskChecklistItem(
                                id = if (itemObj.has("id") && !itemObj.get("id").isJsonNull) itemObj.get("id").asString else "",
                                title = if (itemObj.has("title") && !itemObj.get("title").isJsonNull) itemObj.get("title").asString else "",
                                completed = if (itemObj.has("completed") && !itemObj.get("completed").isJsonNull) itemObj.get("completed").asBoolean else false
                            )
                        )
                    }
                }
                TaskChecklist(type = "CHECKLIST", items = items, comments = emptyList())
            } else if (json.isJsonPrimitive && json.asJsonPrimitive.isString) {
                val str = json.asString.trim()
                if (str.isEmpty() || str == "null") return null
                @Suppress("DEPRECATION")
                val parsed = JsonParser().parse(str)
                deserialize(parsed, typeOfT, context)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}

@JsonAdapter(TaskChecklistAdapter::class)
data class TaskChecklist(
    @SerializedName("type") val type: String = "CHECKLIST",
    @SerializedName("items") val items: List<TaskChecklistItem> = emptyList(),
    @SerializedName("comments") val comments: List<TaskCommentItem> = emptyList()
)

data class TaskItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("status") val status: String = "Pending", // "Pending", "In Progress", "Completed", "Blocked"
    @SerializedName("priority") val priority: String? = "Medium", // "Low", "Medium", "High", "Urgent"
    @SerializedName("dueDate") val dueDate: String? = null,
    @SerializedName("assignedToEmployeeId") val assignedToEmployeeId: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("checklist") val checklist: TaskChecklist? = null,
    @SerializedName("isSpecialTask") val isSpecialTask: Boolean = false,
    @SerializedName("points") val points: Int? = 0,
    @SerializedName("rewardAmount") val rewardAmount: Double? = 0.0,
    @SerializedName("category") val category: String? = null,
    @SerializedName("submissionStatus") val submissionStatus: String? = null,
    @SerializedName("maxClaims") val maxClaims: Int? = null
)

data class TaskListResponse(
    @SerializedName("tasks") val tasks: List<TaskItem> = emptyList(),
    @SerializedName("error") val error: String? = null
)

data class TaskStatusUpdateRequest(
    @SerializedName("status") val status: String? = null,
    @SerializedName("checklist") val checklist: TaskChecklist? = null,
    @SerializedName("comment") val comment: String? = null,
    @SerializedName("author") val author: String? = null
)

data class TaskCommentRequest(
    @SerializedName("text") val text: String,
    @SerializedName("author") val author: String? = null,
    @SerializedName("employeeId") val employeeId: String? = null
)
