
import math
import uuid
import logging

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404

from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from media_library.models import (
    UserVoiceSample,
    GeneratedSpeechAudio,
)

from tts_engine.services.ChatterboxRunPod import (
    generate_speech,
    ChatterboxAPIError,
)


logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def text_to_speech_view(request):

    # --------------------------------------------------
    # 1. GET REQUEST DATA
    # --------------------------------------------------

    text = request.data.get("text", "")
    voice_sample_id = request.data.get("voice_sample_id")

    if not isinstance(text, str) or not text.strip():
        return Response(
            {"error": "Text is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    text = " ".join(text.split())

    if len(text) > 1000:
        return Response(
            {"error": "Text cannot exceed 1000 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not voice_sample_id:
        return Response(
            {"error": "Please select a voice sample."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------
    # 2. GENERATION SETTINGS
    # --------------------------------------------------

    try:
        exaggeration = float(
            request.data.get("exaggeration", 0.5)
        )

        cfg_weight = float(
            request.data.get("cfg_weight", 0.5)
        )

        temperature = float(
            request.data.get("temperature", 0.8)
        )

        seed = int(
            request.data.get("seed", 0)
        )

    except (ValueError, TypeError):
        return Response(
            {"error": "Invalid generation settings."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    values = [exaggeration, cfg_weight, temperature]

    if not all(math.isfinite(value) for value in values):
        return Response(
            {"error": "Generation settings must be valid numbers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not 0.25 <= exaggeration <= 2.0:
        return Response(
            {"error": "Exaggeration must be between 0.25 and 2.0."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not 0.0 <= cfg_weight <= 1.0:
        return Response(
            {"error": "CFG weight must be between 0 and 1."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not 0.05 <= temperature <= 5.0:
        return Response(
            {"error": "Temperature must be between 0.05 and 5.0."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if seed < 0:
        return Response(
            {"error": "Seed cannot be negative."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------
    # 3. GET USER VOICE SAMPLE FROM DATABASE
    # --------------------------------------------------

    voice_sample = get_object_or_404(
        UserVoiceSample,
        id=voice_sample_id,
        user=request.user,
    )

    if not voice_sample.audio_file:
        return Response(
            {"error": "Selected voice sample has no audio file."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------
    # 4. SEND REQUEST TO CHATTERBOX RUNPOD
    # --------------------------------------------------

    try:
        voice_sample.audio_file.open("rb")

        try:
            wav_bytes = generate_speech(
                text=text,
                reference_audio=voice_sample.audio_file,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight,
                temperature=temperature,
                seed=seed,
            )

        finally:
            voice_sample.audio_file.close()

    except ChatterboxAPIError as error:
        logger.error("Chatterbox API error: %s", error)

        return Response(
            {"error": str(error)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    except Exception:
        logger.exception("Unexpected TTS generation error")

        return Response(
            {
                "error": (
                    "An unexpected error occurred "
                    "during audio generation."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # --------------------------------------------------
    # 5. SAVE GENERATED AUDIO TO STORAGE
    # --------------------------------------------------

    filename = (
        f"generated_audio/user_{request.user.id}/"
        f"{uuid.uuid4().hex}.wav"
    )

    try:
        saved_path = default_storage.save(
            filename,
            ContentFile(wav_bytes),
        )

        audio_url = default_storage.url(saved_path)

        if not audio_url.startswith(("http://", "https://")):
            audio_url = request.build_absolute_uri(audio_url)

    except Exception:
        logger.exception("Failed to save generated audio")

        return Response(
            {"error": "Audio was generated but could not be saved."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # --------------------------------------------------
    # 6. SAVE GENERATED AUDIO HISTORY TO DATABASE
    # --------------------------------------------------

    try:
        generated_audio = GeneratedSpeechAudio.objects.create(
            user=request.user,
            text=text,
            audio_file=saved_path,
            language="en",
            exaggeration=exaggeration,
            cfg_weight=cfg_weight,
            temperature=temperature,
            seed=seed,
        )

    except Exception:
        logger.exception(
            "Failed to save generated audio history"
        )

        # Remove the saved file if history creation fails.
        try:
            default_storage.delete(saved_path)
        except Exception:
            logger.exception(
                "Failed to clean up generated audio file"
            )

        return Response(
            {
                "error": (
                    "Audio was generated, but its history "
                    "could not be saved."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # --------------------------------------------------
    # 7. RETURN RESPONSE TO REACT
    # --------------------------------------------------

    return Response(
        {
            "success": True,
            "message": "Audio generated successfully.",
            "history_id": generated_audio.id,
            "audio_url": audio_url,
            "audio_file": saved_path,
            "voice_sample_id": voice_sample.id,
            "language": "sw",
        },
        status=status.HTTP_201_CREATED,
    )
