# python manage.py shell
from .models import Coordenador

Coordenador.objects.create(
    nome_completo="JOSE IRAILDES CIPRIANO RIBEIRO FILHO",
    senha="JOSE123",
    escola="22057498 - CETI CALISTO LOBO",
)