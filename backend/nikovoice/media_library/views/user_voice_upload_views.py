from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from ..models import UserVoiceSample


class UserVoiceSampleUploadView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):

        name = request.data.get("name")
        audio_file = request.FILES.get("audio_file")

        # Validate name
        if not name:
            return Response(
                {"error": "Audio name is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate audio file
        if not audio_file:
            return Response(
                {"error": "Audio file is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save audio sample
        voice_sample = UserVoiceSample.objects.create(
            user=request.user,
            name=name,
            audio_file=audio_file
        )

        return Response(
            {
                "message": "Voice sample uploaded successfully.",
                "voice_sample": {
                    "id": voice_sample.id,
                    "name": voice_sample.name,
                    "audio_file": request.build_absolute_uri(
                        voice_sample.audio_file.url
                    ),
                    "created_at": voice_sample.created_at,
                }
            },
            status=status.HTTP_201_CREATED
        )