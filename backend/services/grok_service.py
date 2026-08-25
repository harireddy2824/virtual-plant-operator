"""
Grok API Backend Service
========================
Centralized service for interacting with xAI / Grok LLM APIs server-side.
Ensures API keys remain secure in backend environment variables.
"""

from __future__ import annotations

import os
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

XAI_API_KEY = os.getenv("XAI_API_KEY", os.getenv("GROK_API_KEY", ""))
XAI_MODEL = os.getenv("XAI_MODEL", os.getenv("GROK_MODEL", "grok-2-latest"))
XAI_BASE_URL = os.getenv("XAI_BASE_URL", "https://api.x.ai/v1").rstrip("/")
XAI_TIMEOUT = float(os.getenv("XAI_TIMEOUT", "45"))


class GrokService:
    def __init__(
        self,
        api_key: str = XAI_API_KEY,
        model: str = XAI_MODEL,
        base_url: str = XAI_BASE_URL,
        timeout: float = XAI_TIMEOUT,
    ):
        self.api_key = api_key or os.getenv("XAI_API_KEY", os.getenv("GROK_API_KEY", ""))
        self.model = model or os.getenv("XAI_MODEL", "grok-2-latest")
        self.base_url = (base_url or os.getenv("XAI_BASE_URL", "https://api.x.ai/v1")).rstrip("/")
        self.timeout = timeout

    @property
    def endpoint(self) -> str:
        return f"{self.base_url}/chat/completions"

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def check_status(self) -> dict[str, str | bool]:
        if not self.is_configured():
            return {
                "available": False,
                "model": self.model,
                "base_url": self.base_url,
                "error": "XAI_API_KEY is not configured in backend environment variables.",
            }
        return {
            "available": True,
            "model": self.model,
            "base_url": self.base_url,
            "error": "",
        }

    def generate(self, prompt: str, system_prompt: str | None = None) -> str:
        if not self.is_configured():
            raise RuntimeError("Grok API key is missing. Set XAI_API_KEY in server environment.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "stream": False,
        }

        try:
            response = requests.post(
                self.endpoint,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()

            choices = data.get("choices", [])
            if not choices:
                raise ValueError("Grok API returned an empty choices list.")

            content = choices[0].get("message", {}).get("content", "").strip()
            if not content:
                raise ValueError("Grok API returned an empty text response.")

            return content
        except requests.exceptions.HTTPError as err:
            status_code = response.status_code if 'response' in locals() else 'Unknown'
            error_msg = f"Grok API HTTP error ({status_code}): {err}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from err
        except requests.exceptions.Timeout as err:
            error_msg = f"Grok API request timed out after {self.timeout}s"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from err
        except requests.exceptions.RequestException as err:
            error_msg = f"Grok API connection failure: {err}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from err
        except Exception as err:
            error_msg = f"Unexpected error calling Grok API: {err}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from err


# Shared instance
grok_service = GrokService()
