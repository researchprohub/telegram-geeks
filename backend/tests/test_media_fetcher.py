import pytest
import asyncio
from unittest.mock import patch, MagicMock
from telegram_layer.src.actions.persona_manager import Persona
from telegram_layer.src.actions.media_fetcher import media_fetcher

@pytest.fixture
def mock_persona():
    return Persona({
        "id": "p1",
        "name": "Test Persona",
        "media": {
            "image_source": "custom_api",
            "custom_api_endpoint": "https://api.example.com/screenshot",
            "custom_api_method": "POST",
            "custom_api_payload": {"context": "{context}"},
            "custom_api_response_key": "data.url",
            "post_with_image_frequency": 1.0 # always trigger
        }
    })

@pytest.mark.asyncio
async def test_custom_api_json_response(mock_persona):
    with patch('aiohttp.ClientSession.post') as mock_post:
        # Mock the context manager returned by aiohttp post
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.headers = {"Content-Type": "application/json"}
        
        async def mock_json():
            return {"data": {"url": "https://example.com/image.png"}}
        mock_response.json = mock_json
        
        # We also need to mock _download_url to avoid actual network call
        with patch.object(media_fetcher, '_download_url', return_value="/tmp/test_image.png") as mock_download:
            mock_post.return_value.__aenter__.return_value = mock_response
            
            result = await media_fetcher.fetch_media_for_persona(mock_persona, "TEST_CONTEXT")
            
            assert result == "/tmp/test_image.png"
            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            assert kwargs["json"] == {"context": "TEST_CONTEXT"}
            mock_download.assert_called_once_with("https://example.com/image.png")

@pytest.mark.asyncio
async def test_media_disabled_toggle(mock_persona):
    mock_persona.media.media_enabled = False
    
    with patch('aiohttp.ClientSession.post') as mock_post:
        result = await media_fetcher.fetch_media_for_persona(mock_persona, "TEST_CONTEXT")
        assert result is None
        mock_post.assert_not_called()

if __name__ == "__main__":
    asyncio.run(test_custom_api_json_response(mock_persona()))
    print("Test passed!")
