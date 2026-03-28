# Amazon Fraud Detection using Random Forest

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Random Forest](https://img.shields.io/badge/Model-Random%20Forest-green.svg)](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)

This project showcases a robust fraud detection system built using **Random Forest** on the **Fraudulent Transactions Prediction** dataset from Kaggle. With over 6.3 million transactions analyzed and advanced feature engineering, the model effectively identifies fraudulent patterns while handling significant class imbalance.

## 🚀 Overview

Fraud detection is a critical challenge in modern financial systems. This project demonstrates:

- **Big Data Handling**: Processing and training on a dataset of 6.3M+ records.
- **Feature Engineering**: Domain-driven features (balance deltas, error flags, draining indicators) for maximum signal.
- **Random Forest Classification**: 200-tree ensemble with optimized hyperparameters.
- **Optimal Threshold Tuning**: F1-score maximization for best precision-recall balance.
- **Class Imbalance Management**: Using balanced class weighting to ensure rare fraud cases are detected.
- **Visual Analytics**: Detailed insights through feature importance, ROC-AUC, confusion matrices, and threshold analysis.

## 📊 Visual Insights

### Feature Importance

The model identified the most critical indicators of fraud. `oldbalanceOrg` and `amount` emerged as the primary drivers of fraudulent activity.

![Feature Importance](visualizations/feature_importance.png)

### Model Performance & Verification

The model achieved an exceptional ROC-AUC score. To ensure reliability, we performed an **overfitting check** and **leakage analysis**:

- **Train vs Test Accuracy**: 1.0000 vs 0.9999 (No overfitting detected).
- **ROC-AUC**: 0.9994 on unseen data, confirming strong discriminative power.
- **Optimal Threshold**: 0.89, selected by maximizing the F1-score.
- **Probability Distribution**: The plot below shows how clearly the model separates the classes.

![Probability Distribution](visualizations/prob_distribution.png)

### Actual vs Predicted Breakdown

To visualize the "difference" between actual and predicted values, we use a log-scale breakdown of correct and incorrect classifications.

![Actual vs Predicted](visualizations/actual_vs_predicted.png)

| Metric | Score |
| :--- | :--- |
| **Accuracy** | 99.99% |
| **ROC-AUC** | 0.9994 |
| **F1-Score (Fraud)** | 0.9988 |
| **False Positives** | 0 |
| **Training Score** | Consistent with Testing |

![ROC Curve](visualizations/roc_curve.png)
![Confusion Matrix](visualizations/confusion_matrix.png)

### Threshold Optimization

Instead of using the default 0.5 threshold, we found the optimal threshold that maximizes the F1-score for the fraud class.

![Threshold Optimization](visualizations/threshold_optimization.png)

## 🛠️ Project Structure

- `preprocess.py`: Data cleaning, feature engineering, encoding, and splitting.
- `train.py`: Model training with optimized hyperparameters using `scikit-learn`.
- `evaluate_visuals.py`: Optimal threshold selection and evaluation plot generation.
- `visualizations/`: Directory containing all generated insights.
- `models/`: Persistent storage for the trained model, encoders, and optimal threshold.

## ⚙️ How to Run

1. **Install Dependencies**:

   ```bash
   pip install pandas matplotlib seaborn scikit-learn joblib kagglehub
   ```

2. **Download & Preprocess**:

   ```bash
   python download_data.py
   python preprocess.py
   ```

3. **Train & Evaluate**:

   ```bash
   python train.py
   python evaluate_visuals.py
   ```

## 📈 Conclusion

This project successfully demonstrates the power of Random Forest in high-stakes environments like fraud detection. The clear visualization of results makes it an ideal showcase for professional portfolios on **GitHub** and **LinkedIn**.

---
*Developed as part of a showcase project for Random Forest Machine Learning applications.*
