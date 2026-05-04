"""
MoFA Agent: Sentiment Classifier
Classifies text as POSITIVE, NEGATIVE, or NEUTRAL
"""

POSITIVE_WORDS = [
    "great","good","excellent","amazing","wonderful","love","best",
    "fantastic","outstanding","brilliant","awesome","superb","perfect",
    "happy","glad","enjoy","nice","helpful","useful","innovative",
    "powerful","fast","efficient","clean","elegant","impressive"
]

NEGATIVE_WORDS = [
    "bad","terrible","poor","awful","horrible","hate","worst","useless",
    "broken","slow","ugly","dirty","wrong","failed","error","crash",
    "bug","issue","problem","difficult","complex","confusing",
    "frustrating","disappointing","boring","weak","limited"
]

def run(text: str) -> dict:
    """Classify sentiment of input text"""
    t = text.lower()
    
    pos_matches = [w for w in POSITIVE_WORDS if w in t]
    neg_matches = [w for w in NEGATIVE_WORDS if w in t]
    
    pos_count = len(pos_matches)
    neg_count = len(neg_matches)
    
    if pos_count > neg_count:
        label = "POSITIVE"
        score = f"+{pos_count}"
        matched = pos_matches
    elif neg_count > pos_count:
        label = "NEGATIVE"
        score = f"-{neg_count}"
        matched = neg_matches
    else:
        label = "NEUTRAL"
        score = "0"
        matched = []
    
    return {
        "agent": "Classifier",
        "engine": "Python",
        "output": f"{label} (score: {score})",
        "label": label,
        "matched_words": matched,
        "description": f"Sentiment classified as {label} based on {len(matched)} indicator words"
    }
