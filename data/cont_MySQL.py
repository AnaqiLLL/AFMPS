import sqlite3
import json

# 读取 JSON 文件
with open('data/2010_Schedule.json', 'r') as f:
    data = json.load(f)

# 连接到 SQLite 数据库
connection = sqlite3.connect("afmps.db")  # 请根据实际路径修改数据库

cursor = connection.cursor()

try:
    # 插入场馆信息
    # 插入场馆信息
    venue_query = """
    INSERT OR IGNORE INTO venues (id, name, city, state, country, zip, address, capacity, surface, roof_type, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    for week in data['weeks']:
        for game in week['games']:
            # 使用get方法来安全地访问字段
            venue_data = (
                game['venue']['id'],
                game['venue']['name'],
                game['venue']['city'],
                game.get('venue', {}).get('state', None),  # 如果没有state字段，返回None
                game.get('venue', {}).get('country', None),
                game.get('venue', {}).get('zip', None),
                game.get('venue', {}).get('address', None),
                game.get('venue', {}).get('capacity', None),
                game.get('venue', {}).get('surface', None),
                game.get('venue', {}).get('roof_type', None),
                game.get('venue', {}).get('location', {}).get('lat', None),
                game.get('venue', {}).get('location', {}).get('lng', None)
            )
            cursor.execute(venue_query, venue_data)

             # 确保scoring字段存在且包含必要的得分信息
            scoring = game.get('scoring', None)
            if scoring is None:
                print(f"Skipping game {game.get('id')} as scoring data is missing.")
                continue  # 跳过该比赛
            
            home_points = scoring.get('home_points')
            away_points = scoring.get('away_points')

            # 确保home_points和away_points存在且为有效值
            if home_points is None or away_points is None:
                print(f"Skipping game {game.get('id')} as home_points or away_points are missing.")
                continue  # 跳过该比赛

            # 插入比赛信息
            game_query = """
            INSERT INTO games (id, scheduled, home_team_id, away_team_id, home_points, away_points, venue_id, broadcast_network, time_zone, weather_condition, weather_humidity, weather_temp, weather_wind_speed, weather_wind_direction)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            game_data = (
                game['id'],
                game['scheduled'],
                game['home']['id'],
                game['away']['id'],
                home_points,  # 使用经过验证的值
                away_points,  # 使用经过验证的值
                game['venue']['id'],
                game.get('broadcast', {}).get('network', None),
                game.get('time_zones', {}).get('venue', None),
                game.get('weather', {}).get('condition', None),
                game.get('weather', {}).get('humidity', None),
                game.get('weather', {}).get('temp', None),
                game.get('weather', {}).get('wind', {}).get('speed', None),
                game.get('weather', {}).get('wind', {}).get('direction', None)
            )
            cursor.execute(game_query, game_data)
            
            # 插入每个季度的得分信息
            period_query = """
            INSERT INTO periods (id, game_id, period_number, home_points, away_points)
            VALUES (?, ?, ?, ?, ?)
            """
            for period in game['scoring']['periods']:
                period_data = (
                    period['id'],
                    game['id'],
                    period['number'],
                    period['home_points'],
                    period['away_points']
                )
                cursor.execute(period_query, period_data)

    # 提交事务
    connection.commit()

finally:
    # 关闭游标和连接
    cursor.close()
    connection.close()

print("Data inserted successfully!")
