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

# 插入变更请求
def create_change_request(description, status):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO change_requests (description, status)
                VALUES (%s, %s)
            ''', (description, status))
            conn.commit()
            print("Change request created successfully.")
        except Error as e:
            print(f"Error: {e}")
        finally:
            cursor.close()
            conn.close()

# 查询变更请求
def get_change_requests():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM change_requests')
            for row in cursor.fetchall():
                print(row)
        except Error as e:
            print(f"Error: {e}")
        finally:
            cursor.close()
            conn.close()
