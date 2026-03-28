# 🌲 Deep Learning From Scratch: Forest Covertype Showdown
> **An end-to-end Machine Learning showcase featuring hand-coded Neural Architectures in NumPy.**

![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-1.19+-013243?style=for-the-badge&logo=numpy&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-0.24+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![ML](https://img.shields.io/badge/Machine-Learning-blue?style=for-the-badge)

---

## 🌟 Project Overview
This repository is a masterclass in **Deep Learning Foundations**. Rather than relying on high-level frameworks, I implemented a **Multi-Layer Perceptron (MLP)** from the ground up using pure linear algebra and calculus.

The project demonstrates the evolution from a simple **Linear Perceptron** to an advanced **Deep Neural Network**, optimized to handle the massive 54-feature **Forest Covertype Dataset**.

### 🎯 Key Achievements
*   **Hand-Coded Engine:** 100% NumPy implementation of Forward Propagation, Backpropagation (Chain Rule), and Gradient Descent.
*   **Advanced Optimization:** Implemented **ReLU Activation**, **Mini-Batch Gradient Descent**, and **L2 Regularization** from scratch.
*   **Diagnostic Mastery:** Built a full suite of analytical visualizations, from **ROC Curves** to **Classification Heatmaps**.
*   **Massive Scale:** Successfully generalized on a complex geographical database of over 500,000 samples.

---

## 🔬 Scientific Showdown: Linear vs. Non-Linear

### 1. The Data Complexity (54-Features)
Real-world tabular data is chaotic. Below is a correlation matrix for the geographical features, illustrating the high-dimensional complexity that linear models fail to parse.

<p align="center">
  <img src="plots/01_feature_correlation.png" width="700" alt="Correlation Matrix">
  <br>
  <i>Figure 1: Diagnosing feature overlap in the Forest Covertype Database.</i>
</p>

### 2. The Learning Evolution
Witness the difference between a linear baseline and deep learning. The Perceptron oscillates wildly on non-linearly separable data, while the **Custom MLP (ReLU + Mini-Batch)** converges smoothly.

<p align="center">
  <img src="plots/02_learning_curves.png" width="700" alt="Learning Curves">
  <br>
  <i>Figure 2: Optimization convergence—Linear oscillations vs. Neural Network stability.</i>
</p>

---

## 📊 Advanced Analytics & Performance

### 📡 Probabilistic Robustness (ROC Curves)
To prove the model isn't just "guessing" accurately, I generated Multi-Class ROC curves. The high AUC (Area Under Curve) across all categories proves the probabilistic confidence of the custom hidden layer.

<p align="center">
  <img src="plots/06_roc_curves.png" width="600" alt="ROC Curves">
</p>

### 📉 Precision, Recall, and F1 Mastery
Handling imbalanced forest cover types requires precision. This diagnostic heatmap breaks down the accuracy per class, proving the network correctly identifies both dominant and rare forest types.

<p align="center">
  <img src="plots/05_classification_report.png" width="600" alt="Classification Report">
</p>

---

## 🏆 Final Result: The Performance Leap
By hand-coding **ReLU**, **Mini-Batches**, and **Regularization**, we pushed the performance ceiling far beyond traditional linear boundaries.

<p align="center">
  <img src="plots/04_accuracy_showdown.png" width="500" alt="Accuracy Bar Chart">
  <br>
  <b>The upgraded Custom MLP achieved a massive accuracy gain over the standard Perceptron.</b>
</p>

---

## 🛠️ Tech Stack & Engineering
*   **Mathematics:** Pure Matrix Multiplication and Calculus (Partial Derivatives) in **NumPy**.
*   **Analytics:** **Pandas**, **Matplotlib**, and **Seaborn** for professional-grade visualization.
*   **Preprocessing:** **Scikit-Learn** for standard scaling and dataset management.

## 🚀 How to Run
1. Clone the repository:
   ```bash
   git clone https://github.com/Kunsh162007/Deep-Learning-From-Scratch-Showcase.git
   ```
2. Install dependencies:
   ```bash
   pip install numpy pandas matplotlib seaborn scikit-learn
   ```
3. Execute the showcase:
   ```bash
   python tabular_showcase.py
   ```

---

*Handcrafted with ❤️ by [Kunsh](https://github.com/Kunsh162007)*
