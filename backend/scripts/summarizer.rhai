// MoFA Agent: Text Summarizer (Rhai Script)
// Summarizes text by extracting the first sentence and adding metadata

let sentences = input.split(".");
let word_count = input.split(" ").len();
let char_count = input.len();

let first_sentence = "";
for s in sentences {
    let trimmed = s.trim();
    if trimmed.len() > 10 {
        first_sentence = trimmed;
        break;
    }
}

if first_sentence == "" {
    first_sentence = input.trim();
}

// Truncate if too long
let summary = first_sentence;
if summary.len() > 120 {
    summary = summary.sub_string(0, 120) + "...";
}

`${summary}. [Stats: ${word_count} words, ${char_count} chars, ${sentences.len()} sentences]`
