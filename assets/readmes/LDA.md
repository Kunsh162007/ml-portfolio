# 🍷 LDA Dimensionality Reduction & Classification

[![Python](https://img.shields.io/badge/Python-3.x-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Algorithm](https://img.shields.io/badge/Algorithm-LDA-purple.svg)](https://en.wikipedia.org/wiki/Linear_discriminant_analysis)

A professional, **from-scratch Linear Discriminant Analysis (LDA)** implementation used to analyze the [UCI Wine Quality (Red) Dataset](https://archive.ics.uci.edu/ml/datasets/wine+quality). This project demonstrates a deep understanding of dimensionality reduction by maximizing class separability through generalized eigenvalue decomposition, coupled with a full data science pipeline generating 9 high-resolution professional visualizations.

---

## 📈 Results at a Glance

| Metric | Details |
| --- | --- |
| **Algorithm** | Custom built from-scratch LDA (`np.linalg.eig`) |
| **Dataset** | 1,599 samples, 11 chemical features, 3 quality tiers (Low/Med/High) |
| **Discriminant Power** | **LD1 explains ~87%** of class separability variance |
| **Validation** | Stratified 80/20 train-test split |
| **Classification Model** | Logistic Regression on LDA-transformed 2D space |

---

## 📂 Project Structure

```text
LDA/
├── src/
│   ├── lda.py              # Custom LDA (from scratch API)
│   └── test_lda.py         # Pytest test suite for validation
├── data/
│   └── winequality-red.csv # UCI dataset
├── reports/
│   └── visuals/            # All generated plots (high-res 300 DPI)
├── wine_quality_analysis.py# Main analysis & visualization pipeline
├── requirements.txt        # Dependencies
├── .gitignore
├── LICENSE                 # MIT License
└── README.md
```

---

## 🚀 Key Features

- **✨ Custom LDA from Scratch** — Complete implementation using purely NumPy linear algebra (within-class scatter $S_W$, between-class scatter $S_B$, and pseudo-inverse `np.linalg.pinv` for numerical stability).
- **🧪 Comprehensive Test Suite** — Fully validated custom algorithm using `pytest`, testing output dimensional geometries, eigenvalue sums, and edge cases.
- **📊 Premium Visualizations** — 9 high-resolution, dark-themed visualizations spanning feature boxplots, correlation matrices, eigenvalues, and decision regions.
- **🔬 Dimensionality Reduction Pipeline** — Transformation of 11 physicochemical features down to just 2 linear discriminants while preserving maximum class separation.
- **🗺️ Geometric Decision Boundaries** — Visualized contour regions of Logistic Regression acting purely on the LDA projected space.

---

## 📊 Visual Analysis

### Executive Master Dashboard

A combined high-impact view of Discriminant Power (Eigenvalue Spectrum), Logistic Regression success, and the 2D LDA Subspace Projection.

![Executive Dashboard](reports/visuals/09_executive_dashboard.png)

### Feature Importance (LDA Loadings)

This horizontal bar chart reveals which original chemical components contribute the most to the primary separating axis (LD1).

![Feature Importance](reports/visuals/08_feature_importance.png)

### 2D Decision Boundaries

The Logistic Regression classifier was trained *only* on the 2 LDA components. The background colors indicate the decision regions carved out in the newly discovered geometrical space.

![Decision Boundaries](reports/visuals/07_decision_boundary.png)

### Class Separability (1D Density)

By tracking density distributions across only LD1, we visualize the incredible separation power achieved by maximizing the Fisher Criterion $(S_W^{-1} S_B)$.

![LD1 Separability](reports/visuals/05_ld1_separability.png)

### Chemical Correlation Heatmap

Understanding the initial linear dependencies between physicochemical properties (e.g. pH vs Fixed Acidity) before running LDA.

![Correlation Heatmap](reports/visuals/02_correlation_heatmap.png)

---

## 💡 Key Insights

1. **LD1 Drives Separation** — The first linear discriminant dominates, capturing ~87% of the total variance necessary to separate the quality tiers, proving that not all features are equally important.
2. **Alcohol and Volatile Acidity** (based on LD1 loadings) are standard heavily-weighted contributors separating low-quality wine from high-quality wine.
3. **The Power of Supervised Reduction** — Unlike PCA (which maximizes total variance ignoring class labels), this LDA implementation efficiently rotates the axes directly toward the maximum separation of quality tiers, making a simple linear classifier highly effective in 2D space.
4. **Stable Eigendecomposition** — The use of the Moore-Penrose pseudo-inverse (`np.linalg.pinv(S_W)`) prevents determinant-zero errors common in highly correlated datasets.

---

## 🔧 How the Custom LDA Works

```python
# Core algorithm in src/lda.py
def fit(self, X, y):
    # 1. Calculate within-class scatter matrix S_W
    # 2. Calculate between-class scatter matrix S_B
    # 3. Solve the generalized eigenvalue problem
    eigvals, eigvecs = np.linalg.eig(np.linalg.pinv(S_W).dot(S_B))
    
    # 4. Sort eigen-pairs and store Top N eigenvectors 
    #    (where N <= n_classes - 1)
    
def transform(self, X):
    # Project data algebraically onto discriminants
    return np.dot(X, self.linear_discriminants)
```

---

## 🛠️ Usage

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run the full analysis pipeline:**

   ```bash
   python wine_quality_analysis.py
   ```

   This runs the EDA, from-scratch geometric projection, testing, and creates 9 images in `reports/visuals/`.

3. **Run tests for the from-scratch algorithm:**

   ```bash
   pytest src/test_lda.py -v
   ```

---

## 📚 Dataset

The [UCI Wine Quality Dataset](https://archive.ics.uci.edu/ml/datasets/wine+quality) relates objective physicochemical tests (e.g. pH values, citric acid) to sensory data (evaluator scores 0-10). The target variable was binned into Low (≤4), Medium (5-6), and High (≥7) quality tiers. 

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
