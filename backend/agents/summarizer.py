"""
MoFA Agent: Text Summarizer
Produces a concise summary with metadata stats
"""

def run(text: str) -> dict:
    """Summarize input text"""
    sentences = [s.strip() for s in text.split('.') if s.strip() and len(s.strip()) > 5]
    words = text.split()
    chars = len(text)
    
    # Pick first meaningful sentence as summary
    first = sentences[0] if sentences else text.strip()
    
    # Truncate if too long
    if len(first) > 150:
        first = first[:150] + "..."
    
    word_count = len(words)
    sent_count = len(sentences)
    
    summary = f"{first}. [Stats: {word_count} words, {chars} chars, {sent_count} sentences]"
    
    return {
        "agent": "Summarizer",
        "engine": "Python",
        "output": summary,
        "stats": {
            "word_count": word_count,
            "char_count": chars,
            "sentence_count": sent_count
        },
        "description": f"Text summarized to first sentence with {word_count} word count metadata"
    }
