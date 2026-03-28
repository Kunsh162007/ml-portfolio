# 🍄 Mushroom Classification: Robust SVM Analysis 🛡️

![Project Banner](https://img.shields.io/badge/Machine%20Learning-SVM-blue?style=for-the-badge&logo=scikit-learn)
![Dataset](https://img.shields.io/badge/Dataset-UCI%20Secondary%20Mushroom-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Optimized-brightgreen?style=for-the-badge)

A high-performance machine learning project focused on classifying mushrooms as **Edible** or **Poisonous** using a Support Vector Machine (SVM) with an RBF kernel. This project addresses real-world challenges like overfitting, data quality (missingness), and model robustness.

---

## 🌟 Key Features

- **Large-Scale Data**: Integrated the **UCI Secondary Mushroom Dataset** (61,069 instances) for robust training.
- **Premium Analytics**: Comprehensive EDA including Missingness Maps and Feature Correlation Heatmaps.
- **Optimized Model**: Hyperparameter tuning via GridSearchCV (C and Gamma optimization).
- **Verification of Generalization**: Robustness tests using noise injection to prove model stability.

---

## 📊 Exploratory Data Analysis

Understanding the data is the first step to a successful model.

````carousel
![Missingness Map](assets/missingness_map.png)
<!-- slide -->
![Target Distribution](assets/target_balance_pie.png)
<!-- slide -->
![Correlation Heatmap](assets/feature_correlation.png)
````

> **Domain Insight**: The dataset contains significant missingness in some categorical traits, which were addressed through mode-based imputation. The target class balance is nearly 50/50, ensuring a fair training process.

---

## 🤖 Model Performance

Our SVM with RBF kernel achieves exceptional performance on the secondary dataset.

### Confusion Matrix & Predictions

The side-by-side comparison below shows the precision of our model against the ground truth.

````carousel
![Actual vs Predicted](assets/actual_vs_predicted.png)
<!-- slide -->
![Confusion Matrix](assets/confusion_matrix.png)
````

### Algorithm Stability

We use ROC and Precision-Recall curves to demonstrate the model's reliability across different thresholds.

````carousel
![ROC Curve](assets/roc_curve.png)
<!-- slide -->
![PR Curve](assets/precision_recall_curve.png)
````

---

## ⚙️ Model Robustness & Feature Importance

We don't just trust high accuracy; we verify it.

### Feature Influence

Using **Permutation Importance**, we identify which mushroom traits most reliably indicate toxicity.
![Feature Importance](assets/feature_importance.png)

### Robustness Test

We simulated real-world "messy" data by injecting Gaussian noise. The model's slow performance decay proves it has learned deep logical rules rather than just memorizing the training points.
![Robustness Test](assets/robustness_test.png)

---

## 🚀 How to Run

1. **Preprocess**: `python src/preprocess.py`
2. **Explore**: `python src/eda.py`
3. **Train**: `python src/train_model.py`
4. **Visualize**: `python src/visualize.py`

## 🛠️ Requirements

- Python 3.x
- pandas, numpy, scikit-learn, matplotlib, seaborn, joblib

---
*Created with focus on Visual Excellence and Model Robustness.*
