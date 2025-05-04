from flask import Flask, render_template, request
import sqlite3
import pandas as pd
from joblib import load
import numpy as np
# 在 app.py 中明确引用类
from VMD_XGBoost import (
    DataEnhancer,
    HierarchicalModelBuilder,
    ModelEvaluator
)

app = Flask(__name__)

# 初始化分层模型
model_builder = load('hierarchical_model.joblib')

def get_db_connection():
    conn = sqlite3.connect('AFMPS.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 获取队伍名称
        cursor.execute("SELECT name FROM teams")
        teams = cursor.fetchall()

        # 获取天气条件
        cursor.execute("SELECT DISTINCT weather_condition FROM games")
        weather_conditions = cursor.fetchall()

        # 获取场地名称
        cursor.execute("SELECT name FROM venues")
        venues = cursor.fetchall()

        conn.close()
        return render_template(
            'index.html',
            teams=teams,
            weather_conditions=weather_conditions,
            venues=venues
        )
    except sqlite3.OperationalError as e:
        return f"数据库错误：请检查表是否存在。详细信息：{str(e)}", 500
    except Exception as e:
        return f"服务器错误：{str(e)}", 500

@app.route('/predict', methods=['POST'])
def predict():
    # 获取表单数据
    home_team_name = request.form['home_team']
    away_team_name = request.form['away_team']
    weather_condition = request.form.get('weather_condition', '')
    venue_name = request.form.get('venue', '')
    
    conn = get_db_connection()
    
    try:
        # 重新获取基础数据（新增部分）
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM teams")
        teams = [row['name'] for row in cursor.fetchall()]
        cursor.execute("SELECT DISTINCT weather_condition FROM games")
        weather_conditions = [row['weather_condition'] for row in cursor.fetchall()]
        cursor.execute("SELECT name FROM venues")
        venues = [row['name'] for row in cursor.fetchall()]

        # 获取队伍ID和特征
        home_team = get_team_features(conn, home_team_name, is_home=True)
        away_team = get_team_features(conn, away_team_name, is_home=False)
        
        # 获取场地特征
        venue_features = get_venue_features(conn, venue_name) if venue_name else {}
        
        # 新增：获取节间比赛特征
        period_features = get_period_features(conn, home_team['home_team_id'], away_team['away_team_id'])
        
        # 构建特征向量
        features = {
            **home_team,
            **away_team,
            **venue_features,
            **period_features,  # 确保合并节间特征
            'weather_condition': weather_condition
        }
        
        print("生成的特征字典:", features)  # 调试输出
        
        # 转换为DataFrame
        input_df = pd.DataFrame([features])
        
        # 特征预处理
        processed_input = model_builder.feature_processor.transform(input_df)
        
        # 执行预测
        score_pred = model_builder.predict(
            home_team['home_team_id'],
            away_team['away_team_id'],
            processed_input
        )[0]
        
        # 计算胜率概率
        win_prob = 1 / (1 + np.exp(-score_pred/10))
        
        # 调试输出
        print(f"预测得分: {score_pred}, 胜率: {win_prob*100:.1f}%")
        
        # 渲染模板
        return render_template(
            'index.html',
            teams=teams,
            weather_conditions=weather_conditions,
            venues=venues,
            home_team=home_team_name,
            away_team=away_team_name,
            prediction={  # 传递预测结果
                'home_score': round(score_pred, 1),
                'away_score': round(score_pred * 0.8, 1),
                'win_prob': f"{win_prob*100:.1f}%"
            }
        )
    except Exception as e:
        return render_template(
            'index.html',
            teams=teams,
            weather_conditions=weather_conditions,
            venues=venues,
            prediction=None,  # 异常时传递 None
            error=f"预测出错: {str(e)}"
        )
    finally:
        conn.close()

def get_team_features(conn, team_name, is_home):
    """获取队伍历史特征"""
    prefix = 'home' if is_home else 'away'
    team = conn.execute(f"""
        SELECT 
            t.id as {prefix}_team_id,
            ts.historical_avg as {prefix}_historical_avg,
            ts.games_played as {prefix}_games_played
        FROM teams t
        JOIN (
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
        ) ts ON t.id = ts.team_id
        WHERE t.name = ?
    """, (team_name,)).fetchone()
    
    return {
        f'{prefix}_team_id': team[f'{prefix}_team_id'],
        f'historical_avg_{prefix}': team[f'{prefix}_historical_avg'],
        f'games_played_{prefix}': team[f'{prefix}_games_played']
    }

def get_venue_features(conn, venue_name):
    """获取场地特征"""
    venue = conn.execute("""
        SELECT capacity, surface, lat, lng 
        FROM venues 
        WHERE name = ?
    """, (venue_name,)).fetchone()
    
    return {
        'capacity': venue['capacity'],
        'surface': venue['surface'],
        'lat': venue['lat'],
        'lng': venue['lng']
    }

def get_period_features(conn, home_team_id, away_team_id):
    """从periods表获取节间比赛特征"""
    try:
        # 查询最近一场比赛的节间数据
        game_id = conn.execute("""
            SELECT id 
            FROM games 
            WHERE home_team_id = ? AND away_team_id = ?
            ORDER BY scheduled DESC 
            LIMIT 1
        """, (home_team_id, away_team_id)).fetchone()['id']
        
        # 计算特征
        period_data = conn.execute("""
            SELECT 
                AVG(home_points) AS home_period_avg,
                AVG(away_points) AS away_period_avg,
                MAX(home_points) - MIN(home_points) AS home_momentum
            FROM periods
            WHERE game_id = ?
        """, (game_id,)).fetchone()
        
        return {
            'home_period_avg': period_data['home_period_avg'] or 0.0,
            'away_period_avg': period_data['away_period_avg'] or 0.0,
            'home_momentum': period_data['home_momentum'] or 0.0
        }
    except Exception as e:
        print(f"无法获取节间特征: {str(e)}")
        return {
            'home_period_avg': 0.0,
            'away_period_avg': 0.0,
            'home_momentum': 0.0
        }
    
if __name__ == '__main__':
    app.run(debug=True)