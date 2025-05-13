# AFMPS 美式橄榄球胜率预测系统
_1.	American Football Match Prediction System (AFMPS)_

![AF.png](AF.png)

## 📝 项目简介

---
## 🚀 功能特点

---
## 📌 系统逻辑说明

---
## 🛠️ 数据库
**2025--2010** 3903条  2009--2000时间跨度太大，参考意义不大
weather:2025--2021
`change_requests`
`configuration_items`
`games`
`periods`:存储每个季度的得分
`teams`
`venues`
`players`

软件配置管理（SCM）
`version_control`:版本控制
`change_requests`:变更管理
`configurations`:配置管理
---
## 📁 项目结构

AFMPS/

├── AF.png

├── README.md

├── requirements.txt

├── model/

└── README.md

└── __init__.py

└── hierarchical_model.joblib

└── model_def.py

└── VMD_XGBoost.py

└── __pycache__/

├── project-root/

└── history.html

└── index.html

└── login.html

└── profile.html

└── teams.html

└── css/
  └── history.css
  └── home.css
  └── login.css
  └── profile.css
  └── teams.css
  └── data.css
  
└── data/
  └── predictions.html
└── js/
  └── history.js
  └── home.js
  └── login.js
  └── profile.js
  └── teams.js
  └── data.js
  

├── use/

└── README.md

---

## 安装

1. 安装 Python 3.8+
2. 安装依赖：

```bash
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
pip install xgboost
```
---
## ⚡ 系统亮点
当前系统的核心算法为 XGBoost，通过以下方式增强：

特征层面：VMD分解提取时序模式

架构层面：分层建模适应不同球队特性

动态层面：贝叶斯模型实现实时修正
---
