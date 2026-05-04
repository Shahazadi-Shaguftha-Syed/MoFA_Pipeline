// MoFA Agent: Keyword Extractor (Rhai Script)
// This script extracts meaningful keywords from input text

let words = input.split(" ");
let keywords = [];
let stopwords = ["the","a","an","is","in","on","at","to","for","of","and","or","it","be","as","by","we","he","she","they","this","that","with","from","are","was","were","has","have","had","but","not","you","i","my","your","our","their","its","do","did","will","would","could","should","may","might","shall","can","need","used"];

for word in words {
    let w = word.to_lower();
    // Remove punctuation manually
    let clean = "";
    for ch in w.chars() {
        if ch >= 'a' && ch <= 'z' {
            clean += ch;
        }
    }
    if clean.len() > 3 && !stopwords.contains(clean) {
        if !keywords.contains(clean) {
            keywords.push(clean);
        }
    }
}

if keywords.len() == 0 {
    "no keywords found"
} else {
    keywords.join(", ")
}
