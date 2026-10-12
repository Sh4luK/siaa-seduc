import mimetypes
import os

import requests
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

API_URL = "https://blob.vercel-storage.com"
API_VERSION = "7"


@deconstructible
class VercelBlobStorage(Storage):
    """Storage de uploads (FileField/ImageField) no Vercel Blob (store público)."""

    def __init__(self):
        self.token = os.environ["BLOB_READ_WRITE_TOKEN"]
        # token: vercel_blob_rw_<storeId>_<secret>
        store_id = self.token.split("_")[3].lower()
        self.base_url = f"https://{store_id}.public.blob.vercel-storage.com"

    def _headers(self, **extra):
        return {
            "Authorization": f"Bearer {self.token}",
            "x-api-version": API_VERSION,
            **extra,
        }

    def _save(self, name, content):
        name = name.replace("\\", "/")
        content.seek(0)
        resp = requests.put(
            f"{API_URL}/{name}",
            data=content.read(),
            headers=self._headers(**{
                "x-add-random-suffix": "0",
                "x-allow-overwrite": "1",
                "x-content-type": mimetypes.guess_type(name)[0] or "application/octet-stream",
            }),
            timeout=60,
        )
        resp.raise_for_status()
        return name

    def exists(self, name):
        # Nomes são únicos via get_available_name (ver abaixo); sempre salvar com sufixo.
        return False

    def get_available_name(self, name, max_length=None):
        # Sem consulta ao Blob: acrescenta sufixo aleatório (comportamento do Django em colisão).
        from django.utils.crypto import get_random_string

        root, ext = os.path.splitext(name)
        name = f"{root}_{get_random_string(7)}{ext}"
        if max_length and len(name) > max_length:
            name = name[-max_length:]
        return name

    def url(self, name):
        return f"{self.base_url}/{name}"

    def delete(self, name):
        requests.post(
            f"{API_URL}/delete",
            json={"urls": [self.url(name)]},
            headers=self._headers(),
            timeout=30,
        )

    def _open(self, name, mode="rb"):
        resp = requests.get(self.url(name), timeout=60)
        resp.raise_for_status()
        return ContentFile(resp.content, name=name)

    def size(self, name):
        resp = requests.head(self.url(name), timeout=30)
        return int(resp.headers.get("content-length", 0))
