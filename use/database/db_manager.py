import mysql.connector
from mysql.connector import Error

# 连接数据库
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",  # 数据库主机
            user="root",  # 数据库用户名
            password="Ql040407",  # 数据库密码
            database="AFMPS"  # 你的数据库名
        )
        if conn.is_connected():
            print("Successfully connected to the database")
        return conn
    except Error as e:
        print(f"Error: {e}")
        return None

# 插入配置项
def insert_configuration_item(name, version, description):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO configuration_items (name, version, description)
                VALUES (%s, %s, %s)
            ''', (name, version, description))
            conn.commit()
            print("Configuration item inserted successfully.")
        except Error as e:
            print(f"Error: {e}")
        finally:
            cursor.close()
            conn.close()

# 查询配置项
def query_configuration_items():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM configuration_items')
            for row in cursor.fetchall():
                print(row)
        except Error as e:
            print(f"Error: {e}")
        finally:
            cursor.close()
            conn.close()
