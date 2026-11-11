from django.conf import settings
from django.db import models


class UserVoiceSample(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="audio_samples"
    )

    name = models.CharField(max_length=150)

    audio_file = models.FileField(
        upload_to="user_voice_samples/"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class GeneratedSpeechAudio(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="generated_speech_audios"
    )

    text = models.TextField()

    audio_file = models.FileField(
        upload_to="generated_speech_audio/"
    )

    language = models.CharField(
        max_length=10,
        default="sw"
    )

    exaggeration = models.FloatField(default=0.5)

    cfg_weight = models.FloatField(default=0.5)

    temperature = models.FloatField(default=0.8)

    seed = models.PositiveBigIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Generated Speech Audio"
        verbose_name_plural = "Generated Speech Audios"

    def __str__(self):
        return f"Generated Speech Audio - User {self.user_id}"
