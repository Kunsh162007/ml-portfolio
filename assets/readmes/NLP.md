# 🧠 NLP Text Classification — One-Hot Encoding vs Bi-LSTM

> **Comparing classical and deep learning NLP representations for text classification.**
> One-Hot (Bag-of-Words) · Bidirectional LSTM (RNN)
> Evaluated on IMDB Sentiment & AG News Topic Classification

---

## 📌 Project Overview

This project compares two word representation approaches — sparse classical vectors vs sequential deep learning — and evaluates their impact on real classification tasks.

| Approach | Method | Semantic Awareness | OOV Handling |
|----------|--------|-------------------|--------------|
| Classical | One-Hot (BoW + Bigrams) | ❌ None | ❌ Unknown words dropped |
| Deep Learning | Bi-LSTM (RNN) | ✅ Sequential context | Learned from data |

---

## 🗂️ Project Structure

```
NLP_TextClassification_Embeddings-RNN/
├── data/
│   └── load_datasets.py          # IMDB + AG News loaders (HuggingFace)
├── src/
│   ├── preprocessing.py          # Tokenization, stopwords, lemmatization
│   ├── embeddings/
│   │   └── onehot.py             # CountVectorizer (binary + bigrams) + LR
│   ├── models/
│   │   └── rnn_classifier.py     # PyTorch Bi-LSTM + Vocabulary + Trainer
│   ├── train.py                  # Experiment runner (argparse CLI)
│   └── visualize.py              # Accuracy bars, confusion matrices, F1
├── notebooks/
│   └── NLP_Embeddings_RNN_Walkthrough.ipynb
├── results/                      # Auto-generated plots + JSON summaries
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/nlp-embeddings-rnn.git
cd nlp-embeddings-rnn
```

### 2. Create virtual environment
```bash
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Download NLTK data (one-time)
```bash
python -c "import nltk; [nltk.download(r) for r in ['punkt','stopwords','wordnet','omw-1.4','punkt_tab']]"
```

### 5. Run experiments

```bash
# Smoke test first (~2 min)
python src/train.py --dataset imdb --models onehot rnn --max_train 500 --max_test 100 --epochs 2

# Full IMDB run
python src/train.py --dataset imdb --models onehot rnn --max_train 8000 --max_test 2000 --epochs 15

# Full AG News run
python src/train.py --dataset agnews --models onehot rnn --max_train 8000 --max_test 2000 --epochs 10
```

---

## 📊 Results

### IMDB Sentiment (Binary Classification)

| Model | Accuracy |
|-------|----------|
| One-Hot (BoW + Bigrams) | 84.85% |
| Bi-LSTM (15 epochs) | 82.85% |

### AG News (4-class Topic Classification)

| Model | Accuracy |
|-------|----------|
| One-Hot (BoW + Bigrams) | 87.25% |
| Bi-LSTM (10 epochs) | 81.10% |

---

## 🧪 Key Concepts Covered

### 1. Text Preprocessing
- **Tokenization** — splitting text into words
- **Stopword Removal** — filtering low-information words (the, is, at...)
- **Lemmatization** — reducing words to base form (running → run)

### 2. One-Hot Encoding (Bag of Words)
- Each word → binary sparse vector of vocabulary size
- No semantic similarity — `king` and `queen` are as different as `king` and `banana`
- Combined with bigrams and Logistic Regression — surprisingly strong baseline

### 3. Bidirectional LSTM
- Processes text as a sequence, reading forwards and backwards simultaneously
- LSTM gates (forget, input, output) solve the vanishing gradient problem
- Captures word order and long-range dependencies that BoW misses

---

## 💡 Key Takeaways

| Factor | One-Hot (BoW) | Bi-LSTM |
|--------|--------------|---------|
| Training Speed | ⚡ Seconds | 🐢 Minutes |
| Memory | ❌ High (sparse) | ✅ Low (dense) |
| Word Order | ❌ Ignored | ✅ Captured |
| Interpretability | ✅ Easy | ❌ Black box |
| IMDB Accuracy | 84.85% | 82.85% |
| AG News Accuracy | 87.25% | 81.10% |

---

## 📚 References

- Hochreiter & Schmidhuber (1997) — [Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf)
- Maas et al. (2011) — [IMDB Sentiment Dataset](https://ai.stanford.edu/~amaas/data/sentiment/)
- Zhang et al. (2015) — [AG News Dataset](https://arxiv.org/abs/1509.01626)

---

## 👤 Author

**Kunsh** | B.Tech ECE, MANIT Bhopal
Interests: Machine Learning · NLP · Deep Learning · Robotics

---

*Built as part of an NLP foundations study — exploring classical vs deep learning NLP methods.*
