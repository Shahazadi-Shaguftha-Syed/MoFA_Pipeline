// MoFA Agent: Sentiment Classifier (Rhai Script)
// Classifies text sentiment as POSITIVE, NEGATIVE, or NEUTRAL

let text = input.to_lower();

let positive_words = ["great","good","excellent","amazing","wonderful","love","best","fantastic","outstanding","brilliant","awesome","superb","perfect","happy","glad","enjoy","nice","helpful","useful","innovative","powerful","fast","efficient","clean","elegant"];

let negative_words = ["bad","terrible","poor","awful","horrible","hate","worst","useless","broken","slow","ugly","dirty","wrong","failed","error","crash","bug","issue","problem","difficult","complex","confusing","frustrating","disappointing"];

let pos_count = 0;
let neg_count = 0;

for word in positive_words {
    if text.contains(word) {
        pos_count += 1;
    }
}

for word in negative_words {
    if text.contains(word) {
        neg_count += 1;
    }
}

if pos_count > neg_count {
    `POSITIVE (score: +${pos_count})`
} else if neg_count > pos_count {
    `NEGATIVE (score: -${neg_count})`
} else {
    "NEUTRAL (score: 0)"
}
