# model_def.py
from sklearn.base import BaseEstimator

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