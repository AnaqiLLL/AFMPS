
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
import os
from flask_cors import CORS
from joblib import load
# 在app.py顶部添加以下代码
import sys
from pathlib import Path
# 在现有导入语句中添加以下两行
import pandas as pd
import numpy as np

# 获取项目根目录（假设app.py位于 use/api/）
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # 向上三级到777目录
sys.path.append(str(BASE_DIR))  # 将项目根目录加入系统路径

# 从model包导入类定义
from model.model_def import HierarchicalModelBuilder

app = Flask(__name__)
CORS(app)  # 启用跨域请求支持

# 获取当前文件的绝对路径
current_file = Path(__file__).resolve()

try:
    from model.model_def import HierarchicalModelBuilder
    print("成功导入HierarchicalModelBuilder类")
except ImportError as e:
    print(f"导入失败: {str(e)}")
    raise

# 计算正确的模型路径（向上三级到777目录）
MODEL_PATH = current_file.parent.parent.parent / 'model' / 'hierarchical_model.joblib'
MODEL_PATH = str(MODEL_PATH)
try:
    model_builder = load(MODEL_PATH)
    print(f"模型加载成功，类型：{type(model_builder)}")
except Exception as e:
    print(f"模型加载失败: {str(e)}")
    raise

# 调试输出
print("当前系统路径:", sys.path)
print("项目根目录:", BASE_DIR)
print("模型文件存在:", os.path.exists(BASE_DIR / 'model' / 'hierarchical_model.joblib'))

model_builder = load(MODEL_PATH)

# 数据库连接函数
def get_db_connection():
    # 打印当前工作目录，帮助调试
    current_dir = os.getcwd()
    print(f"当前工作目录:{current_dir}")
    
    # 尝试多种可能的数据库路径
    db_paths = [
        '../AFMPS.db',                    # 原始相对路径
        'use/AFMPS.db',                   # 如果从项目根目录运行
        'AFMPS.db',                       # 如果数据库在当前目录
        os.path.join(current_dir, 'use/AFMPS.db'),  # 绝对路径1
        os.path.join(current_dir, 'AFMPS.db'),      # 绝对路径2
        os.path.join(os.path.dirname(current_dir), 'AFMPS.db')  # 上级目录
    ]
    
    # 尝试每个可能的路径
    for db_path in db_paths:
        exists = os.path.exists(db_path)
        print(f"尝试数据库路径 {db_path}: {'存在' if exists else '不存在'}")
        if exists:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            return conn
    
    # 如果所有路径都失败，打印错误并返回None
    print("错误：找不到数据库文件AFMPS.db")
    return None

def get_period_features(conn, home_team_id, away_team_id):
    """获取两队比赛节间特征"""
    try:
        # 获取主队第四节得分占比
        home_stats = conn.execute("""
            SELECT stamina_rating, period_score
            FROM team_dynamic_ratings 
            WHERE id = ?
        """, (home_team_id,)).fetchone()
        
        # 获取客队第四节得分占比
        away_stats = conn.execute("""
            SELECT stamina_rating, period_score
            FROM team_dynamic_ratings 
            WHERE id = ?
        """, (away_team_id,)).fetchone()
        
        return {
            "home_momentum": home_stats["stamina_rating"] if home_stats else 60.0,
            "home_period_avg": home_stats["period_score"] if home_stats else 0.0, 
            "away_momentum": away_stats["stamina_rating"] if away_stats else 60.0,
            "away_period_avg": away_stats["period_score"] if away_stats else 0.0 
        }
    except sqlite3.Error as e:
        print(f"节间特征查询失败: {str(e)}")
        return {
            "home_momentum": 60.0,
            "home_period_avg": 0.0,  # 默认值
            "away_momentum": 60.0,
            "away_period_avg": 0.0   # 默认值
        }

# 添加根路径路由
@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "欢迎使用美式足球比赛预测系统API", "status": "online"})

# 获取所有队伍
@app.route('/api/teams', methods=['GET'])
def get_teams():
    conn = get_db_connection()
    teams = conn.execute('SELECT id, name, market FROM teams').fetchall()
    conn.close()
    
    return jsonify([dict(team) for team in teams])

# 获取所有场地
@app.route('/api/venues', methods=['GET'])
def get_venues():
    conn = get_db_connection()
    venues = conn.execute('SELECT id, name, city FROM venues').fetchall()
    conn.close()
    
    return jsonify([dict(venue) for venue in venues])

# 获取天气条件（从历史数据中提取不同的天气条件）
@app.route('/api/weather', methods=['GET'])
def get_weather():
    conn = get_db_connection()
    weather = conn.execute('SELECT DISTINCT weather_condition FROM games WHERE weather_condition IS NOT NULL').fetchall()
    conn.close()
    
    return jsonify([dict(w)["weather_condition"] for w in weather])

# 提交预测请求
@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        # 支持两种数据格式
        if request.is_json:
            data = request.json
            home_id = data.get('home')
            away_id = data.get('away')
            weather = data.get('weather')
            stadium_id = data.get('stadium')
        else:
            data = request.form
            home_id = data.get('home_team')
            away_id = data.get('away_team')
            weather = data.get('weather_condition')
            stadium_id = data.get('venue')

        # 获取数据库连接
        conn = get_db_connection()
        try:
            cursor = conn.execute('SELECT * FROM team_stats_view')
            data = cursor.fetchall()
            print("视图查询结果:", data)  # 调试输出
        # 获取特征数据
            home_features = get_team_features_by_id(conn, home_id)
            away_features = get_team_features_by_id(conn, away_id)
            venue_features = get_venue_features_by_id(conn, stadium_id)
            period_features = get_period_features(conn, home_id, away_id)

        # 调试输出
            print("home_features 键:", home_features.keys())
            print("away_features 键:", away_features.keys())
            print("venue_features 键:", venue_features.keys())
            print("period_features 键:", period_features.keys())
            print("period_features 值:", period_features)

        except sqlite3.OperationalError as e:
            print(f"数据库查询失败: {e}")
            return jsonify({"error": "内部服务器错误"}), 500
        finally:
            if conn:
                conn.close()
        period_features = get_period_features(conn, home_id, away_id)
        # 构建特征字典
        feature_dict = {
            "home_team_id": home_id,
            "away_team_id": away_id,
            "weather_condition": weather,
            "historical_avg_home": home_features["historical_avg"],
            "games_played_home": home_features["games_played"],
            "historical_avg_away": away_features["historical_avg"],
            "games_played_away": away_features["games_played"],
            "capacity": venue_features["capacity"],
            "home_period_avg": period_features["home_period_avg"], 
    "away_period_avg": period_features["away_period_avg"],  
            "home_momentum": period_features["home_momentum"],
            "away_momentum": period_features["away_momentum"]
        }

        # 转换为DataFrame并进行特征预处理
        input_df = pd.DataFrame([feature_dict])
        processed_input = model_builder.feature_processor.transform(input_df)

        # 执行分层预测
        score_pred = model_builder.predict(
            home_id,
            away_id,
            processed_input
        )[0]

        # 计算胜率概率（使用sigmoid函数转换）
        win_prob = 1 / (1 + np.exp(-score_pred / 10)) * 100
        win_prob = float(win_prob)

        # 构建响应数据
        response_data = {
            "win_probability": round(win_prob, 1),
            "indicators": {
                "offense": home_features["offense_rating"],
                "defense": home_features["defense_rating"],
                "stamina": home_features["stamina_rating"]
            }
        }

        # 根据请求类型返回响应
        if request.is_json:
            return jsonify(response_data)
        else:
            return render_template(
                "predictions.html",
                prediction=response_data,
                home_team=home_features["name"],
                away_team=away_features["name"]
            )

    except Exception as e:
        app.logger.error(f"预测失败: {str(e)}")
        error_msg = f"预测服务暂时不可用: {str(e)}" if app.debug else "服务暂时不可用"
        if request.is_json:
            return jsonify({"error": error_msg}), 500
        else:
            return render_template(
                "predictions.html",
                error=error_msg
            )
    finally:
        if 'conn' in locals():
            conn.close()
    
# ========================
# 新增特征获取函数
# ========================
def get_team_features_by_id(conn, team_id):
    """动态获取队伍特征"""
    try:
        team = conn.execute("""
            SELECT 
                t.id,
                t.name,
                t.market,
                dr.offense_rating,
                dr.defense_rating,
                dr.stamina_rating,
                historical_avg,  
                (SELECT COUNT(*) FROM games 
                WHERE home_team_id = t.id OR away_team_id = t.id) AS games_played
            FROM teams t
            LEFT JOIN team_dynamic_ratings dr ON t.id = dr.id
            WHERE t.id = ?
        """, (team_id,)).fetchone()

        if not team:
            raise ValueError(f"队伍ID {team_id} 不存在")

        return {
            "id": team["id"],
            "name": team["name"],
            "offense_rating": team["offense_rating"] or 50.0,
            "defense_rating": team["defense_rating"] or 50.0,
            "stamina_rating": team["stamina_rating"] or 60.0,
            "historical_avg": team["historical_avg"] if team else 0.0,
            "games_played": team["games_played"]
        }
    except sqlite3.OperationalError as e:
        print(f"数据库错误: {str(e)}")
        raise

def get_venue_features_by_id(conn, venue_id):
    """通过场地ID获取特征"""
    venue = conn.execute("""
        SELECT capacity, surface, lat, lng 
        FROM venues 
        WHERE id = ?
    """, (venue_id,)).fetchone()
    return dict(venue)

# 添加favicon路由
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

def initialize_database():
    conn = get_db_connection()
    try:
        # 删除旧视图（如果存在）
        conn.execute('DROP VIEW IF EXISTS team_stats_view;')
        # 创建新视图，添加 historical_avg 和 games_played
        conn.execute('''
            CREATE VIEW team_stats_view AS
            SELECT 
                t.id AS team_id,
                t.name AS team_name,
                COUNT(g.id) AS games_played,
                AVG(g.home_points) AS historical_avg,
                AVG(dr.period_score) AS period_avg  -- 新增字段
            FROM teams t
            LEFT JOIN games g ON t.id = g.home_team_id
            LEFT JOIN team_dynamic_ratings dr ON t.id = dr.id  -- 假设关联表存在
            GROUP BY t.id;
        ''')
        conn.commit()
    except sqlite3.Error as e:
        print(f"初始化数据库失败: {e}")
    finally:
        conn.close()

# 在app.py中添加诊断接口
@app.route('/diagnose/db')
def diagnose_db():
    conn = get_db_connection()
    try:
        # 检查periods表结构
        columns = conn.execute("PRAGMA table_info(periods)").fetchall()
        period_columns = [col['name'] for col in columns]
        
        # 检查必要字段
        required = ['period_type', 'number']
        missing = [col for col in required if col not in period_columns]
        
        return jsonify({
            "table": "periods",
            "status": "OK" if not missing else "ERROR",
            "missing_columns": missing,
            "current_columns": period_columns
        })
    finally:
        conn.close()

# 在应用启动时调用
if __name__ == '__main__':
    initialize_database()
    app.run(debug=False, port=5000)