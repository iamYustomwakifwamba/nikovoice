
import os
import requests

from django.conf import settings


class ChatterboxAPIError(Exception):
    """Raised when Chatterbox API fails."""
    pass


def generate_speech(
    text,
    reference_audio,
    exaggeration=0.5,
    cfg_weight=0.5,
    temperature=0.8,
    seed=0,
):
    api_url = getattr(
        settings,
        "CHATTERBOX_API_URL",
        os.getenv("CHATTERBOX_API_URL", ""),
    )

    if not api_url:
        raise ChatterboxAPIError(
            "CHATTERBOX_API_URL is not configured."
        )

    endpoint = f"{api_url.rstrip('/')}/tts"

    data = {
        "text": text,
        "language": "sw",
        "exaggeration": str(exaggeration),
        "cfg_weight": str(cfg_weight),
        "temperature": str(temperature),
        "seed": str(seed),
    }

    files = None

    try:
        if reference_audio:
            reference_audio.seek(0)

            files = {
                "reference_audio": (
                    os.path.basename(reference_audio.name),
                    reference_audio,
                    "audio/wav",
                )
            }

        response = requests.post(
            endpoint,
            data=data,
            files=files,
            timeout=(30, 300),
        )

        if response.status_code != 200:
            try:
                detail = response.json().get(
                    "detail",
                    response.text,
                )
            except ValueError:
                detail = response.text

            raise ChatterboxAPIError(
                f"Chatterbox error ({response.status_code}): {detail}"
            )

        if not response.content.startswith(b"RIFF"):
            raise ChatterboxAPIError(
                "Chatterbox returned an invalid WAV file."
            )

        return response.content

    except requests.exceptions.Timeout:
        raise ChatterboxAPIError(
            "Chatterbox generation timed out."
        )

    except requests.exceptions.RequestException as error:
        raise ChatterboxAPIError(
            f"Could not connect to Chatterbox: {str(error)}"
        )
