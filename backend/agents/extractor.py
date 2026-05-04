"""
MoFA Agent: Keyword Extractor
Uses Rhai scripting engine (via rhai CLI) with Python fallback
"""
import subprocess
import os

SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "../scripts/extractor.rhai")

STOPWORDS = {
    "the","a","an","is","in","on","at","to","for","of","and","or","it",
    "be","as","by","we","he","she","they","this","that","with","from",
    "are","was","were","has","have","had","but","not","you","i","my",
    "your","our","their","its","do","did","will","would","could","should"
}

def run(text: str) -> dict:
    """Extract keywords from text using Rhai script (with Python fallback)"""
    
    # Try Rhai engine first (satisfies tech stack requirement)
    rhai_result = _try_rhai(text)
    if rhai_result:
        return {
            "agent": "Extractor",
            "engine": "Rhai",
            "output": rhai_result,
            "description": "Keywords extracted via Rhai scripting engine"
        }
    
    # Python fallback
    words = text.split()
    keywords = []
    seen = set()
    for word in words:
        clean = ''.join(c.lower() for c in word if c.isalpha())
        if len(clean) > 3 and clean not in STOPWORDS and clean not in seen:
            keywords.append(clean)
            seen.add(clean)
    
    result = ", ".join(keywords) if keywords else "no keywords found"
    return {
        "agent": "Extractor",
        "engine": "Python",
        "output": result,
        "description": "Keywords extracted via Python (Rhai fallback)"
    }

def _try_rhai(text: str) -> str | None:
    """Attempt to run Rhai script"""
    try:
        # Try rhai-run (install: cargo install rhai-run)
        result = subprocess.run(
            ["rhai-run", SCRIPT_PATH],
            input=f'let input = "{text.replace(chr(34), chr(39))}";',
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return None

def chr(code):
    return bytes([code]).decode()
