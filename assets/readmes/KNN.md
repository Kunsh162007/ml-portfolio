# 🧪 KNN Glass Identification: Forensic Intelligence

[![Python](https://img.shields.io/badge/Python-3.x-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Algorithm](https://img.shields.io/badge/Algorithm-KNN-orange.svg)](https://en.wikipedia.org/wiki/K-nearest_neighbors_algorithm)

A professional-grade, **from-scratch K-Nearest Neighbors** implementation applied to forensic glass classification using the [UCI Glass Identification Dataset](https://archive.ics.uci.edu/ml/datasets/glass+identification). This project demonstrates deep understanding of the KNN algorithm — including distance computation, weighted voting, feature scaling, and hyperparameter optimization — through a real-world criminological use-case.

---

## 📈 Results at a Glance

| Metric | Value |
| --- | --- |
| **Best Accuracy** | **81.48%** |
| **Optimal K** | 3 |
| **Weighting Strategy** | Uniform voting |
| **Dataset** | 214 samples, 9 chemical features, 6 glass types |
| **Evaluation** | Stratified 75/25 train-test split |

---

## 📂 Project Structure

```text
KNN/
├── src/
│   ├── knn.py              # Custom KNN classifier (from scratch)
│   └── test_knn.py         # Pytest test suite
├── data/
│   ├── glass.data           # UCI dataset
│   └── glass.names          # Dataset documentation
├── reports/
│   └── visuals/             # All generated plots (high-res 300 DPI)
├── glass_analysis.py        # Main analysis & visualization pipeline
├── requirements.txt         # Dependencies
├── LICENSE                  # MIT License
└── README.md
```

---

## 🚀 Key Features

- **✨ Custom KNN from Scratch** — Full implementation of the KNN algorithm using only NumPy, including Euclidean distance computation and both uniform & distance-weighted voting.
- **⚙️ Automated Hyperparameter Tuning** — Grid search across K=1–20 with two weighting strategies to find optimal configuration.
- **📊 Professional Visualizations** — 10 high-resolution plots including a forensic intelligence dashboard, PCA clustering with density contours, and confusion matrices.
- **🔬 Feature Scaling** — Proper use of `StandardScaler` (fit on train, transform on test) to handle varying feature magnitudes.
- **🗺️ Dimensionality Reduction** — PCA projection with KDE density contours for forensic cluster visualization.

---

## 📊 Visual Analysis

### Forensic Intelligence Dashboard

A combined view of hyperparameter sensitivity, classification success grid, model parameters, and chemical fingerprint averages.

![Forensic Dashboard](reports/visuals/forensic_dashboard.png)

### PCA Cluster Analysis with Density Contours

PCA projection reveals distinct chemical clusters — Containers and Headlamps are clearly separable from window glass types.

![PCA Clusters](reports/visuals/viz_pca_clusters.png)

### Actual vs Predicted Classification

Strip plot showing correct (green) vs misclassified (red) predictions for each glass type.

![Actual vs Predicted](reports/visuals/viz_actual_vs_predicted.png)

### Confusion Matrix

Detailed breakdown of classification performance across all glass types.

![Confusion Matrix](reports/visuals/viz_confusion_matrix_final.png)

### Chemical Composition Analysis

Distribution of chemical features showing outliers across the dataset.

![Box Plots](reports/visuals/viz_outliers_boxplots.png)

### Feature Correlation Matrix

Lower-triangular heatmap revealing inter-feature dependencies critical for understanding KNN's behavior.

![Correlation Heatmap](reports/visuals/viz_correlation_heatmap.png)

---

## 💡 Key Insights

1. **K=3 is optimal** — Smaller K values capture local decision boundaries better for this multi-class problem with overlapping clusters.
2. **Uniform weighting outperforms distance weighting** — The classes are well-separated enough after scaling that inverse-distance weighting doesn't provide additional benefit.
3. **Feature scaling is critical** — Raw feature magnitudes vary enormously (Si ≈ 72 vs Fe ≈ 0.05). Without `StandardScaler`, KNN would be dominated by high-magnitude features like Silicon.
4. **PCA reveals clear forensic clusters** — The density contour plot shows that Container glass and Headlamps form distinct chemical clusters, making them reliably identifiable for investigators.
5. **Class imbalance affects rare types** — Vehicle Non-Float glass (Type 4) is absent from the dataset, and rare classes like Tableware have lower precision due to limited training samples.

---

## 🔧 How the Custom KNN Works

```python
# Core algorithm in src/knn.py
class KNN:
    def __init__(self, k=3, weights='uniform'):
        # k: number of neighbors
        # weights: 'uniform' (majority vote) or 'distance' (inverse-distance weighted)

    def fit(self, X, y):
        # Lazy learner — simply stores training data

    def predict(self, X):
        # For each test point:
        # 1. Compute Euclidean distance to all training points
        # 2. Find K nearest neighbors
        # 3. Vote (uniform or distance-weighted)
```

---

## 🛠️ Usage

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run the full analysis pipeline:**

   ```bash
   python glass_analysis.py
   ```

   This will train the model, perform hyperparameter tuning, and generate all visualizations in `reports/visuals/`.

3. **Run tests:**

   ```bash
   pytest src/test_knn.py -v
   ```

---

## 📚 Dataset

The [UCI Glass Identification Dataset](https://archive.ics.uci.edu/ml/datasets/glass+identification) contains 214 samples of glass with 9 chemical composition features (RI, Na, Mg, Al, Si, K, Ca, Ba, Fe) and 6 class types. The dataset was originally created for forensic science — glass fragments found at crime scenes can be classified to help identify their origin.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
