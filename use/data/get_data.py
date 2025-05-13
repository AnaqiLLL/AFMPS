import requests
import json

url = "https://api.sportradar.com/nfl/official/trial/v7/en/games/2010/REG/schedule.json"

headers = {
    "accept": "application/json",
    "x-api-key": "ftAGNX8W4ZHb2vQN47VV1SLv9372PRq6q7AZbKAZ"
}

response = requests.get(url, headers=headers)
data = response.json()

# 指定保存路径
file_path = "data/2010_Schedule.json"

# 将数据写入 JSON 文件
with open(file_path, "w", encoding="utf-8") as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=4)
