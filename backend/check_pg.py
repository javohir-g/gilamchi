import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def check_postgres():
    # Common default connection parameters
    params_list = [
        {"user": "postgres", "password": "admin", "host": "localhost", "port": "5432"},
        {"user": "postgres", "password": "password", "host": "localhost", "port": "5432"},
        {"user": "postgres", "password": "root", "host": "localhost", "port": "5432"},
        {"user": "postgres", "password": "postgres", "host": "localhost", "port": "5432"},
        {"user": "postgres", "password": "", "host": "localhost", "port": "5432"},
    ]
    
    successful_params = None
    for params in params_list:
        try:
            conn = psycopg2.connect(dbname="postgres", **params)
            conn.close()
            successful_params = params
            print(f"Successfully connected with params: {params}")
            break
        except Exception as e:
            print(f"Failed with {params['password']}: {e}")
            
    if successful_params:
        try:
            # Connect to default 'postgres' db to create our app db
            conn = psycopg2.connect(dbname="postgres", **successful_params)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = conn.cursor()
            
            # Check if db exists
            cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'gilamchi'")
            exists = cur.fetchone()
            if not exists:
                cur.execute('CREATE DATABASE gilamchi')
                print("Database 'gilamchi' created.")
            else:
                print("Database 'gilamchi' already exists.")
            
            cur.close()
            conn.close()
            
            # Final verification
            conn = psycopg2.connect(dbname="gilamchi", **successful_params)
            print("Successfully connected to 'gilamchi' database.")
            conn.close()
            
            return successful_params
        except Exception as e:
            print(f"Error during db setup: {e}")
    return None

if __name__ == "__main__":
    result = check_postgres()
    if result:
        print(f"RESULT_URL: postgresql://{result['user']}:{result['password']}@{result['host']}:{result['port']}/gilamchi")
    else:
        print("FAILED_TO_CONNECT")
