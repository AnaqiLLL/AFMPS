import sqlite3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, roc_auc_score
from xgboost import XGBRegressor, XGBClassifier
from joblib import dump, load
import matplotlib.pyplot as plt

# ========================
# 数据增强模块
# ========================
class DataEnhancer:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)
         # 确保表存在
        self.conn.execute("PRAGMA foreign_keys = ON;")
        self._check_tables_exist()

    def _check_tables_exist(self):
        """验证必需表是否存在"""
        required_tables = ['games', 'teams', 'venues', 'periods', 'players']
        c = self.conn.cursor()
        
        for table in required_tables:
            c.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}';")
            if not c.fetchone():
                raise RuntimeError(f"Required table '{table}' is missing! Run database_init.py first.")
                
    # VMD_XGBoost.py 中定义
    def _query_period_features(self):
        """从periods表提取节间比赛特征"""
        period_query = """
        WITH period_stats AS (
            SELECT 
                game_id,
                period_number,
                AVG(home_points) OVER(PARTITION BY game_id) AS avg_home_period,
                AVG(away_points) OVER(PARTITION BY game_id) AS avg_away_period,
                MAX(home_points) OVER(PARTITION BY game_id) AS max_home_period
            FROM periods
        )
        SELECT 
            game_id,
            ROUND(AVG(avg_home_period), 1) AS home_period_avg,
            ROUND(AVG(avg_away_period), 1) AS away_period_avg,
            ROUND((MAX(max_home_period) - MIN(avg_home_period)), 1) AS home_momentum
        FROM period_stats
        GROUP BY game_id
        """
        return pd.read_sql(period_query, self.conn)
    
    def load_enhanced_data(self):
        """增强版数据加载"""
        # 基础数据
        base_query = """
        SELECT 
            g.id AS game_id,
            g.scheduled,
            g.home_team_id,
            g.away_team_id,
            g.venue_id,
            g.weather_condition,
            g.weather_temp,
            g.home_points,
            g.away_points
        FROM games g
        """
        df = pd.read_sql(base_query, self.conn)
        
        # 合并节间特征
        period_df = self._query_period_features()
        df = pd.merge(df, period_df, on='game_id', how='left')
        
        # 添加队伍历史特征
        team_stats = pd.read_sql("""
            SELECT 
                team_id,
                AVG(points) AS historical_avg,
                COUNT(*) AS games_played
            FROM (
                SELECT home_team_id AS team_id, home_points AS points FROM games
                UNION ALL
                SELECT away_team_id AS team_id, away_points AS points FROM games
            )
            GROUP BY team_id
        """, self.conn)
        
        df = pd.merge(df, team_stats, left_on='home_team_id', right_on='team_id', suffixes=('', '_home'))
        df = pd.merge(df, team_stats, left_on='away_team_id', right_on='team_id', suffixes=('_home', '_away'))
        
        self.conn.close()
        return df.dropna()

# ========================
# 分层建模器
# ========================
class HierarchicalModelBuilder:
    def __init__(self, min_games=100):
        self.min_games = min_games
        self.strong_teams = []
        self.models = {}
        self.global_model = None
        self.feature_processor = None
        
    def _get_team_strength(self, df):
        """识别强队"""
        home_counts = df['home_team_id'].value_counts()
        away_counts = df['away_team_id'].value_counts()
        total_counts = home_counts.add(away_counts, fill_value=0)
        return total_counts[total_counts > self.min_games].index.tolist()
    
    def _build_feature_pipeline(self):
        """构建特征处理管道"""
        return ColumnTransformer([
            ('cat', OneHotEncoder(handle_unknown='ignore'), 
            ['home_team_id', 'away_team_id', 'weather_condition']),
            ('num', StandardScaler(), 
            [
                'home_period_avg', 'away_period_avg', 'home_momentum',
                'historical_avg_home', 'games_played_home', 
                'historical_avg_away', 'games_played_away'
            ])
        ])
    
    def _tune_model(self, model, param_grid, X, y):
        """网格搜索优化"""
        gs = GridSearchCV(model, param_grid, cv=3, scoring='neg_mean_squared_error', n_jobs=-1)
        gs.fit(X, y)
        return gs.best_estimator_
    
    def train(self, df):
        """分层训练流程"""
        # 识别强队
        self.strong_teams = self._get_team_strength(df)
        
        # 特征处理管道
        self.feature_processor = self._build_feature_pipeline()
        
        # 全局模型训练
        X_global = self.feature_processor.fit_transform(df)
        y_score_global = df['home_points']
        
        # XGBoost参数网格
        xgb_param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [3, 5],
            'learning_rate': [0.1, 0.05]
        }
        
        # 训练全局回归模型
        global_reg = self._tune_model(
            XGBRegressor(objective='reg:squarederror'),
            xgb_param_grid,
            X_global,
            y_score_global
        )
        
        # 训练强队专属模型
        for team in self.strong_teams:
            team_data = df[(df['home_team_id'] == team) | (df['away_team_id'] == team)]
            X_team = self.feature_processor.transform(team_data)
            y_team = team_data['home_points'] if team_data['home_team_id'].iloc[0] == team \
                      else team_data['away_points']
            
            model = self._tune_model(
                XGBRegressor(objective='reg:squarederror'),
                xgb_param_grid,
                X_team,
                y_team
            )
            self.models[team] = model
        
        # 保存全局模型
        self.global_model = global_reg
        
    def predict(self, home_team, away_team, features):
        """分层预测"""
        if home_team in self.models:
            return self.models[home_team].predict(features)
        elif away_team in self.models:
            return self.models[away_team].predict(features)
        else:
            return self.global_model.predict(features)
        
    def validate_feature_structure(self, input_df):
        """验证输入特征是否匹配训练结构"""
        expected_features = self.feature_processor.get_feature_names_out()
        missing = set(expected_features) - set(input_df.columns)
        if missing:
            raise ValueError(f"缺少必要特征: {missing}")

# ========================
# 评估可视化模块
# ========================
class ModelEvaluator:
    @staticmethod
    def plot_predictions(y_true, y_pred, title):
        plt.figure(figsize=(12, 6))
        plt.plot(y_true, 'b-', label='Actual')
        plt.plot(y_pred, 'r--', label='Predicted')
        plt.title(title)
        plt.xlabel('Sample Index')
        plt.ylabel('Score')
        plt.legend()
        plt.grid(linestyle='--', alpha=0.7)
        plt.tight_layout()
        plt.show()
    
    @staticmethod
    def print_metrics(y_true, y_pred):
        return {
            'MSE': mean_squared_error(y_true, y_pred),
            'RMSE': np.sqrt(mean_squared_error(y_true, y_pred)),
            'MAE': mean_absolute_error(y_true, y_pred),
            'R2': r2_score(y_true, y_pred)
        }

# ========================
# 执行主程序
# ========================
if __name__ == "__main__":
    # 数据准备
    enhancer = DataEnhancer('AFMPS.db')
    df = enhancer.load_enhanced_data()
    
    # 拆分数据集
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)
    
    # 训练模型
    model_builder = HierarchicalModelBuilder(min_games=50)
    model_builder.train(train_df)
    
    # 测试评估
    X_test = model_builder.feature_processor.transform(test_df)
    y_test = test_df['home_points']
    
    # 获取预测结果
    predictions = []
    for _, row in test_df.iterrows():
        pred = model_builder.predict(
            row['home_team_id'],
            row['away_team_id'],
            model_builder.feature_processor.transform(pd.DataFrame([row])))
        predictions.append(pred[0])
    
    # 可视化与指标
    ModelEvaluator.plot_predictions(y_test.values[:50], predictions[:50], 'Test Set Prediction Comparison')
    metrics = ModelEvaluator.print_metrics(y_test, predictions)
    print("Regression Metrics:")
    for k, v in metrics.items():
        print(f"{k}: {v:.4f}")
    
    # 模型保存
    dump(model_builder, 'hierarchical_model.joblib')