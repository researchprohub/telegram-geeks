import os
import io
import csv
import json
import uuid
import random
import aiohttp
import tempfile
from typing import Optional, Dict
from loguru import logger
from .persona_manager import Persona

class MediaFetcherService:
    """Fetches media (images) for personas from various external sources."""

    def __init__(self):
        self.temp_dir = os.path.join(tempfile.gettempdir(), "telegram_geeks_media")
        os.makedirs(self.temp_dir, exist_ok=True)

    async def fetch_media_for_persona(self, persona: Persona, context: str = "") -> Optional[str]:
        """
        Determines if media should be fetched based on persona frequency,
        and fetches it from the configured source.
        Returns the local file path to the downloaded media, or None.
        """
        if not getattr(persona.media, "media_enabled", True):
            return None

        if persona.media.image_source == "none":
            return None

        # Determine if we should post an image based on frequency (0.0 to 1.0)
        if random.random() > persona.media.post_with_image_frequency:
            return None

        source = persona.media.image_source
        logger.info(f"Fetching media for persona {persona.id} from source: {source}")

        try:
            if source == "google_sheet":
                return await self._fetch_from_google_sheet(persona)
            elif source == "custom_api":
                return await self._fetch_from_custom_api(persona, context)
            elif source == "url":
                # Fallback to a single generic URL if that old config is present
                url = persona.media.data.get("url")
                if url:
                    return await self._download_url(url)
            # Future enhancements: ai_gen, google_drive
        except Exception as e:
            logger.error(f"Failed to fetch media for persona {persona.id}: {e}")

        return None

    async def _fetch_from_google_sheet(self, persona: Persona) -> Optional[str]:
        """
        Fetches an image URL from a public Google Sheet CSV export.
        Assuming the URL is the entire CSV export URL (e.g. docs.google.com/spreadsheets/d/.../export?format=csv)
        """
        sheet_url = persona.media.google_sheet_url
        if not sheet_url:
            logger.warning("No Google Sheet URL configured for persona.")
            return None

        # Make sure it's downloading a CSV if it's a standard google sheets URL
        if "/edit" in sheet_url:
            sheet_url = sheet_url.split("/edit")[0] + "/export?format=csv"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(sheet_url) as response:
                    if response.status != 200:
                        logger.error(f"Google Sheet fetch failed with status {response.status}")
                        return None
                    text = await response.text()

            # Parse CSV and collect all URLs (assuming one URL per row, or scanning the first column)
            urls = []
            reader = csv.reader(io.StringIO(text))
            for row in reader:
                for cell in row:
                    if cell.strip().startswith("http://") or cell.strip().startswith("https://"):
                        urls.append(cell.strip())

            if not urls:
                logger.warning("No valid URLs found in the Google Sheet.")
                return None

            # Pick a random URL from the sheet
            selected_url = random.choice(urls)
            return await self._download_url(selected_url)

        except Exception as e:
            logger.error(f"Error reading Google Sheet: {e}")
            return None

    async def _fetch_from_custom_api(self, persona: Persona, context: str) -> Optional[str]:
        """
        Fetches an image from a custom API. Supports both binary image responses
        and JSON responses containing a URL.
        """
        endpoint = persona.media.custom_api_endpoint
        if not endpoint:
            logger.warning("No Custom API endpoint configured.")
            return None

        method = persona.media.custom_api_method.upper()
        headers = persona.media.custom_api_headers or {}
        payload = persona.media.custom_api_payload or {}
        response_key = persona.media.custom_api_response_key

        # Inject context into payload if it's a dict
        if isinstance(payload, dict):
            # We can do a deep replace of a placeholder string, e.g. "{context}"
            payload_str = json.dumps(payload).replace("{context}", context)
            payload = json.loads(payload_str)

        try:
            async with aiohttp.ClientSession() as session:
                if method == "POST":
                    async with session.post(endpoint, headers=headers, json=payload) as response:
                        return await self._handle_custom_api_response(response, response_key)
                else:
                    async with session.get(endpoint, headers=headers) as response:
                        return await self._handle_custom_api_response(response, response_key)
        except Exception as e:
            logger.error(f"Error fetching from custom API: {e}")
            return None

    async def _handle_custom_api_response(self, response: aiohttp.ClientResponse, response_key: str) -> Optional[str]:
        if response.status != 200:
            logger.error(f"Custom API returned status {response.status}")
            return None

        content_type = response.headers.get("Content-Type", "")

        # If it's returning JSON, extract the URL
        if "application/json" in content_type:
            data = await response.json()
            # Navigate nested keys if they provided something like "data.url"
            keys = response_key.split(".") if response_key else []
            val = data
            for k in keys:
                if isinstance(val, dict):
                    val = val.get(k)
                else:
                    val = None
            
            if isinstance(val, str) and (val.startswith("http://") or val.startswith("https://")):
                return await self._download_url(val)
            else:
                logger.error(f"Extracted key '{response_key}' did not contain a valid URL. Found: {val}")
                return None

        # Otherwise, assume it's returning binary image data
        image_data = await response.read()
        ext = ".png"
        if "jpeg" in content_type or "jpg" in content_type:
            ext = ".jpg"
        elif "gif" in content_type:
            ext = ".gif"
        
        return self._save_binary_to_temp(image_data, ext)

    async def _download_url(self, url: str) -> Optional[str]:
        """Downloads an image from a URL and saves it to a temporary file."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        image_data = await response.read()
                        
                        # Guess extension from content type or URL
                        content_type = response.headers.get("Content-Type", "")
                        ext = ".jpg"
                        if "png" in content_type:
                            ext = ".png"
                        elif "gif" in content_type:
                            ext = ".gif"
                        
                        return self._save_binary_to_temp(image_data, ext)
                    else:
                        logger.error(f"Failed to download image from {url}, status: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Exception downloading URL {url}: {e}")
            return None

    def _save_binary_to_temp(self, data: bytes, ext: str) -> str:
        filename = f"media_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(self.temp_dir, filename)
        with open(filepath, "wb") as f:
            f.write(data)
        logger.debug(f"Saved media to {filepath}")
        return filepath

# Global singleton
media_fetcher = MediaFetcherService()
