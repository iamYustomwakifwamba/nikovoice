from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework import status

from ..models import UserVoiceSample


class UserVoiceSamplesListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        voice_samples = UserVoiceSample.objects.filter(
            user=request.user
        ).order_by("-created_at")

        data = [
            {
                "id": sample.id,
                "name": sample.name,
                "audio_file": request.build_absolute_uri(
                    sample.audio_file.url
                ),
                "created_at": sample.created_at,
            }
            for sample in voice_samples
        ]

        return Response({
            "message": "Voice samples retrieved successfully.",
            "count": len(data),
            "voice_samples": data,
        }, status=status.HTTP_200_OK)