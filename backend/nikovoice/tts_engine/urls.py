from django.urls import path

from tts_engine.views.text_to_speech_view import (
    text_to_speech_view,
)


urlpatterns = [
    path(
        "generate/",
        text_to_speech_view,
        name="text-to-speech",
    ),
]