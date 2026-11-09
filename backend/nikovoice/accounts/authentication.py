from rest_framework.authentication import SessionAuthentication


class CsrfEnforcedSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication ya kawaida inakagua CSRF kwa watumiaji walioingia tu.
    Hii inakagua CSRF kila mara (ikiwemo kwenye login), na haitambulishi
    mtu yeyote yenyewe.
    """

    def authenticate(self, request):
        self.enforce_csrf(request)
        return None