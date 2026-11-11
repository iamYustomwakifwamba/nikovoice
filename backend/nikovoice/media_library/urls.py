from django.urls import path
from .views.user_voice_upload_views import UserVoiceSampleUploadView
from .views.user_voices_view import UserVoiceSamplesListView
from .views.user_tts_history_view import user_tts_history_view

urlpatterns = [
    path(
        "voice-samples/upload/",
        UserVoiceSampleUploadView.as_view(),
        name="voice-sample-upload"
    ),
    path(
        "voice-samples/",
        UserVoiceSamplesListView.as_view(),
        name="voice-samples-list",
    ),
    path(
        "tts-history/",
        user_tts_history_view,
        name="user-tts-history"
    ),
]