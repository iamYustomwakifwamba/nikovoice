
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from media_library.models import GeneratedSpeechAudio


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_tts_history_view(request):

    audios = GeneratedSpeechAudio.objects.filter(
        user=request.user
    ).order_by("-created_at")

    history = []

    for audio in audios:
        audio_url = None

        if audio.audio_file:
            audio_url = request.build_absolute_uri(
                audio.audio_file.url
            )

        history.append({
            "id": audio.id,
            "text": audio.text,
            "audio_url": audio_url,
            "language": audio.language,
            "exaggeration": audio.exaggeration,
            "cfg_weight": audio.cfg_weight,
            "temperature": audio.temperature,
            "seed": audio.seed,
            "created_at": audio.created_at,
        })

    return Response(
        {
            "success": True,
            "count": len(history),
            "history": history,
        },
        status=status.HTTP_200_OK
    )
