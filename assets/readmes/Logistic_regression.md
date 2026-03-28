# ❤️ Heart Disease Prediction: Logistic Regression Showcase

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![ML-Category](https://img.shields.io/badge/ML-Logistic_Regression-green.svg)](https://en.wikipedia.org/wiki/Logistic_regression)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is a high-fidelity showcase of **Logistic Regression** for medical diagnosis. It features a custom mathematical implementation from scratch and sophisticated statistical evaluation with **integrated performance metrics**.

## 🚀 Key Features

* **Mathematical Depth**: Logistic Regression built from scratch using NumPy (Sigmoid, Gradient Descent, Binary Cross-Entropy).
* **Integrated Metrics**: Every plot includes a technical breakdown of **Accuracy, Precision, Recall, and F1-Score**.
* **Intuitive Explainability**: Annotated density plots and confusion matrices designed to showcase predictive logic.
* **Clean Repository**: Modular structure focused on model potential and technical transparency.

## 📊 Dataset

The project utilizes the **Heart Disease Cleveland Dataset**, analyzing 14 clinical features to identify risk factors and predict the presence of heart disease.

## 📈 Methodology

1. **EDA & Preprocessing**: Data cleaning and feature scaling via `StandardScaler`.
2. **Custom Model Implementation**: Full implementation of the Logistic Regression algorithm (Odds calculation, Sigmoid map, Log-Loss) without high-level ML libraries.
3. **Comprehensive Evaluation**: Performance assessment using advanced class-separation analysis and ROC-AUC metrics.

## 🖼️ Technical Showcase (Metrical Evolution)

### 1. Separation Power & Metric Summary

The density plot below highlights the model's ability to separate healthy patients from at-risk ones. An integrated **Metrics Box** displays the Test Accuracy (~85%), Precision, Recall, and F1-score.

![Separation Power](visuals/actual_vs_predicted_dist.png)

### 2. Result Breakdown

The confusion matrix provides a granular view of the model's classification accuracy, showing exactly how many patients were correctly identified versus misclassified.

![Confusion Matrix](visuals/confusion_matrix_annotated.png)

### 3. Feature Impact (Statistical Significance)

Visual analysis of the model's coefficients, identifying the clinical drivers that contribute most to the risk prediction.

![Feature Drivers](visuals/feature_importance.png)

---

Developed to showcase the intersection of mathematics, machine learning, and comprehensive performance analysis.
