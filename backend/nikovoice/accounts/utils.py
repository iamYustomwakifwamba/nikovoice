
def user_payload(user):
    """
    Returns authenticated user data based on
    the custom NIKOVOICE User model.
    """
    return {
        "id": user.id,
        "email": user.email,
        "phone": str(user.phone) if user.phone else None,
        "country": user.country,
        "role": user.role,
        "is_active": user.is_active,
        "date_joined": user.date_joined.isoformat(),
    }
