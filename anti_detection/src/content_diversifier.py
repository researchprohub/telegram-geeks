"""Content diversifier — paraphrasing, personalization, uniqueness."""

import re
import random
from loguru import logger


class ContentDiversifier:
    """Ensures all AI-generated content is unique and human-like."""

    # Common synonyms for paraphrasing
    SYNONYMS = {
        "good": ["great", "nice", "solid", "awesome", "fantastic"],
        "bad": ["terrible", "poor", "rough", "awful", "not great"],
        "interesting": ["fascinating", "intriguing", "cool", "thought-provoking"],
        "important": ["crucial", "key", "essential", "vital", "significant"],
        "think": ["believe", "feel", "reckon", "figure", "suspect"],
        "know": ["understand", "realize", "get", "see"],
        "really": ["totally", "absolutely", "definitely", "seriously", "honestly"],
        "like": ["love", "enjoy", "appreciate", "dig", "into"],
        "thing": ["stuff", "item", "aspect", "element", "bit"],
        "thing": ["stuff", "aspect", "bit", "part"],
        "also": ["plus", "additionally", "on top of that", "besides", "furthermore"],
        "but": ["however", "although", "though", "yet", "still"],
        "so": ["therefore", "thus", "hence", "that's why"],
        "because": ["since", "due to", "as", "given that"],
        "very": ["really", "quite", "pretty", "super", "highly"],
        "many": ["several", "numerous", "a lot of", "plenty of"],
        "some": ["a few", "certain", "various", "multiple"],
    }

    # Typo patterns for realistic imperfection
    TYPO_PATTERNS = [
        ("thier", "their"), ("recieve", "receive"), ("occured", "occurred"),
        ("seperate", "separate"), ("definately", "definitely"), ("wierd", "weird"),
        ("untill", "until"), ("beleive", "believe"), ("goverment", "government"),
        ("informtion", "information"), ("peple", "people"), ("becuase", "because"),
        ("alot", "a lot"), ("dont", "don't"), ("cant", "can't"), ("wont", "won't"),
    ]

    @staticmethod
    def paraphrase(text: str, style: str = "casual") -> str:
        """Rewrite text using synonym substitution."""
        words = text.split()
        result = []
        for word in words:
            clean_word = word.lower().strip(".,!?;:")
            if clean_word in ContentDiversifier.SYNONYMS and random.random() < 0.3:
                synonym = random.choice(ContentDiversifier.SYNONYMS[clean_word])
                # Preserve capitalization
                if word[0].isupper():
                    synonym = synonym.capitalize()
                if word.endswith(('.', ',', '!', '?', ';', ':')):
                    punctuation = word[-1]
                    synonym += punctuation
                    word = word[:-1]
                result.append(synonym)
            else:
                result.append(word)
        return " ".join(result)

    @staticmethod
    def add_personal_touch(text: str, persona: dict) -> str:
        """Add persona-specific quirks to text."""
        humor = persona.get("humor_level", 0.3)
        energy = persona.get("energy_level", 0.5)
        tone = persona.get("tone", "casual")

        additions = []
        if humor > 0.5 and random.random() < humor * 0.3:
            additions.append(random.choice([" 😂", " lol", " hahaha", " 😄"]))
        if energy > 0.7 and random.random() < 0.3:
            additions.append(random.choice(["!", "!!", "!!!"]))
        elif energy < 0.3 and random.random() < 0.3:
            additions.append(random.choice([".", "..."]))

        return text + "".join(additions)

    @staticmethod
    def vary_message_length(base_length: int, persona: dict) -> int:
        """Determine target message length based on persona."""
        formality = persona.get("formality_level", 0.4)
        # Formal people write longer messages
        variance = random.uniform(0.5, 1.5)
        if formality > 0.6:
            variance = random.uniform(0.8, 2.0)
        elif formality < 0.2:
            variance = random.uniform(0.3, 1.0)
        return int(base_length * variance)

    @staticmethod
    def detect_duplicate(new_text: str, recent_texts: list[str], threshold: float = 0.8) -> bool:
        """Check if new text is too similar to recent texts."""
        import difflib
        normalized = lambda t: re.sub(r'\s+', ' ', t.lower().strip())
        new_norm = normalized(new_text)

        for old in recent_texts:
            old_norm = normalized(old)
            ratio = difflib.SequenceMatcher(None, new_norm, old_norm).ratio()
            if ratio >= threshold:
                return True
        return False

    @staticmethod
    def add_typo_variation(text: str, education_level: float = 0.5) -> str:
        """Add realistic typos based on education level (inverse correlation)."""
        if random.random() > (1 - education_level) * 0.05:  # 5% max typo rate
            return text

        typos = [t for t, _ in ContentDiversifier.TYPO_PATTERNS]
        if typos:
            typo = random.choice(typos)
            words = text.split()
            if words:
                idx = random.randint(0, len(words) - 1)
                words[idx] = typo
                return " ".join(words)
        return text

    @staticmethod
    def ensure_uniqueness(text: str, recent_texts: list[str], persona: dict) -> str:
        """Ensure text is unique from recent messages and apply persona touches."""
        if ContentDiversifier.detect_duplicate(text, recent_texts):
            text = ContentDiversifier.paraphrase(text)

        text = ContentDiversifier.add_personal_touch(text, persona)
        text = ContentDiversifier.add_typo_variation(text, persona.get("formality_level", 0.4))

        return text
