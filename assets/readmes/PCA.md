# 🏃‍♂️ Human Activity Recognition — PCA Deep Dive

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![NumPy](https://img.shields.io/badge/NumPy-SVD_Engine-013243?style=for-the-badge&logo=numpy)](https://numpy.org)
[![Algorithm](https://img.shields.io/badge/PCA-From_Scratch-2ECC71?style=for-the-badge)]()

> **561 sensor features → 50 components → 91 % compression → clear human activity clusters.**
>
> A portfolio project demonstrating custom SVD-based Principal Component Analysis on the UCI Human Activity Recognition dataset.

---

## 📋 Dataset at a Glance

| Property | Value |
|---|---|
| **Source** | [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/Human+Activity+Recognition+Using+Smartphones) |
| **Subjects** | 30 volunteers (age 19–48) |
| **Sensor** | Samsung Galaxy S II (waist-mounted) |
| **Signals** | Accelerometer + Gyroscope at 50 Hz |
| **Features** | 561 time- and frequency-domain variables |
| **Classes** | 6 activities — Walking, Walking Upstairs, Walking Downstairs, Sitting, Standing, Laying |
| **Train set** | 7,352 samples |

---

## 🔬 Mathematical Foundation

PCA finds a new set of orthogonal axes (principal components) that capture the maximum variance in the data.

This implementation uses **Singular Value Decomposition** instead of the covariance-matrix approach for better numerical stability:

```
1.  Centre the data           X_c = X − μ
2.  Economy SVD               X_c = U · S · Vᵀ
3.  Keep top-k directions     V_k = Vᵀ[:k]
4.  Project                   Z   = X_c · V_kᵀ          (n × k)
5.  Reconstruct (lossy)       X̂  = Z · V_k + μ
```

**Explained variance** of each component: `λᵢ = sᵢ² / (n − 1)`, where `sᵢ` are the singular values.

---

## 🎨 Visual Discoveries

### 1. Activity Clusters in 2D & 3D

PCA compresses 561 noisy signals into two axes that cleanly separate **Stationary** (blue circles) from **Dynamic** (orange/red triangles) activities.

![2D Projection](plots/har_pca_2d.png)

Adding a third component reveals finer differences — for example, **Walking Downstairs** separates from level-ground walking due to unique vertical acceleration.

![3D Projection](plots/har_pca_3d.png)

---

### 2. What Drives the Separation? (Biplot)

Red arrows overlay the most influential sensor features onto the cluster map. Signals like **tGravityAcc** and **tBodyAccJerk** act as compass needles pointing toward the activity zones they define.

![Biplot](plots/har_biplot.png)

---

### 3. How Many Components Do We Need? (Scree Plot)

A dual-axis scree plot with the exact 90 % crossing point annotated. We need only ~30–50 of the 561 original features.

![Scree Plot](plots/har_variance.png)

---

### 4. Feature Loading Matrix

The heatmap reveals which specific sensor signals load most heavily onto each principal component, giving us interpretable "themes" for each PC.

![Heatmap](plots/har_heatmap.png)

---

### 5. PC1 Feature Breakdown

A ranked view of the top 15 features driving the primary axis. Green bars push toward stationary states; red bars toward dynamic motion.

![Feature Importance](plots/har_feature_importance.png)

---

### 6. Reconstruction Error Trade-Off

As we add components, the reconstruction error drops steeply — proving that the first few PCs carry the lion's share of information.

![Reconstruction Error](plots/har_reconstruction.png)

---

## ✅ Correctness Verification

The pipeline includes a **cross-check against scikit-learn's PCA**. Our variance ratios match to within **< 10⁻¹⁰**, confirming the implementation is mathematically correct.

---

## 📂 Project Structure

```
├── har_pca/
│   ├── __init__.py          # Package exports
│   ├── data_loader.py       # UCI HAR parser
│   ├── module.py            # SVD-based PCA engine
│   └── visualizer.py        # 7-plot visualisation suite
├── plots/                   # Generated high-DPI assets
├── main.py                  # Full showcase pipeline
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

```bash
pip install -r requirements.txt
python main.py
```

This regenerates all plots, prints dataset statistics, and runs the sklearn cross-check.

---

## 💡 Key Takeaways

1. **PCA via SVD** is more numerically stable than the covariance-matrix eigen-decomposition.
2. **91 % compression** (561 → 50 features) with negligible reconstruction loss.
3. **Gravity** and **body acceleration jerk** are the sensor signals that most strongly separate human activity states.
4. Stationary vs. dynamic activities are **linearly separable** in PCA space — no nonlinear methods needed for this split.
