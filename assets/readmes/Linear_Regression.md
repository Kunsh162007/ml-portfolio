# 📈 Stock Market Prediction using Linear Regression

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Machine Learning](https://img.shields.io/badge/ML-Linear--Regression-orange.svg)](https://en.wikipedia.org/wiki/Linear_regression)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](CONTRIBUTING.md)

A professional, modular machine learning pipeline designed to predict stock market trends (specifically the S&P 500) using historical data from Yahoo Finance.

---

## 🚀 Key Features

- **📡 Live Data Ingestion**: Seamlessly fetches real-time historical data using the `yfinance` API.
- **🛠️ Feature Engineering**: Implements sophisticated lagged variables and Moving Averages (SMA) to capture time-series trends.
- **🏗️ Modular Architecture**: Clean, production-ready project structure with separated concerns (Data, Ingestion, Preprocessing, Modeling, Visualization).
- **📊 Insightful Visualizations**: Automatically generates professional-grade plots for trend analysis and performance evaluation.

---

## 📂 Project Structure

```text
Linear_Regression/
├── data/               # Raw and processed datasets (CSV)
├── exports/            # Generated professional plots & saved models (.joblib)
├── src/                # Core Source Code
│   ├── data_ingestion.py   # API interactions with Yahoo Finance
│   ├── preprocessing.py    # Feature engineering & scaling logic
│   ├── model.py            # Linear Regression training/prediction wrapper
│   └── visualization.py    # Advanced plotting utilities
├── main.py             # Orchestrates the entire pipeline
├── requirements.txt    # Project dependencies
├── LICENSE             # MIT License
└── README.md           # This comprehensive guide
```

---

## 📊 Visualizations

The pipeline automatically generates two key insights for performance monitoring:

### 1. Market Trend Projection

Shows the model's predicted price (Orange) vs the actual closing price (Blue) over the test period.
![Market Trend](exports/sp500_predictions.png)

### 2. Error Distribution (Residuals)

A histogram analysis of the prediction errors, verifying the model's consistency.
![Error Distribution](exports/residuals_dist.png)

---

## 🛠️ Getting Started

### 1. Installation

Clone the repository and install the dependencies:

```bash
pip install -r requirements.txt
```

### 2. Usage

To run the complete pipeline from data fetching to visualization:

```bash
python main.py
```

---

## 🧠 Technologies Used

- **Language**: [Python](https://www.python.org/)
- **Data Manipulation**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Machine Learning**: [Scikit-Learn](https://scikit-learn.org/)
- **Data Ingestion**: [yfinance](https://pypi.org/project/yfinance/)
- **Visualization**: [Matplotlib](https://matplotlib.org/)

---

## 📈 Model Performance

Currently optimized for the S&P 500 Index (`^GSPC`):

- **Features**: 5-day Lags, 20-day SMA, 50-day SMA.
- **Algorithm**: Linear Regression.
- **Metric**: High $R^2$ accuracy on recent market data.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed for Portfolio Showcase** • [Kunsh162007](https://github.com/Kunsh162007)
