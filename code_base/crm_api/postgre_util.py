import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from dotenv import load_dotenv

class PostgreUtil:
    def __init__(self):
        load_dotenv()
        
        # Get database configuration from environment variables
        CLOUD_HOST = os.getenv('CLOUD_POSTGRES_HOST')
        CLOUD_PORT = os.getenv('CLOUD_POSTGRES_PORT')
        CLOUD_USER = os.getenv('CLOUD_POSTGRES_USER')
        CLOUD_PASSWORD = os.getenv('CLOUD_POSTGRES_PASSWORD')  # No default - must be set in .env
        CLOUD_DB = os.getenv('CLOUD_POSTGRES_DB')
        
        # Check if required environment variables are provided
        if not all([CLOUD_HOST, CLOUD_PORT, CLOUD_USER, CLOUD_PASSWORD, CLOUD_DB]):
            print("⚠️  Missing required environment variables")
            print("Please create a .env file with your database credentials")
            raise ValueError("Missing required database environment variables")
        
        # Cloud Database Configuration
        CLOUD_DATABASE_URL = f"postgresql+psycopg2://{CLOUD_USER}:{CLOUD_PASSWORD}@{CLOUD_HOST}:{CLOUD_PORT}/{CLOUD_DB}?sslmode=require"
        
        # Local Database Configuration (fallback)
        LOCAL_DATABASE_URL = f"postgresql+psycopg2://{os.getenv('POSTGRES_USER', 'postgres')}:{os.getenv('POSTGRES_PASSWORD', '')}@{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'real_estate_crm')}"
        
        # Use cloud database by default, fallback to local if needed
        USE_CLOUD = os.getenv('USE_CLOUD_DB', 'true').lower() == 'true'
        
        if USE_CLOUD:
            self.engine = create_engine(CLOUD_DATABASE_URL, pool_pre_ping=True)
            print("Using Cloud Database (PostgreUtil)")
        else:
            self.engine = create_engine(LOCAL_DATABASE_URL, pool_pre_ping=True)
            print("Using Local Database (PostgreUtil)")

    def custom_query(self, query, params=None):
        with self.engine.connect() as conn:
            # Autocommit for all non-SELECT statements
            if not query.strip().lower().startswith("select"):
                conn = conn.execution_options(isolation_level="AUTOCOMMIT")
            result = conn.execute(text(query), params or {})
            try:
                return result.fetchall()
            except Exception:
                return None

    def create_table_query(self, query, drop=False):
        with self.engine.connect() as conn:
            if drop:
                table_name = query.split()[5] if 'IF NOT EXISTS' in query else query.split()[2]
                conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
            conn.execute(text(query))

    def drop_table(self, table_name):
        with self.engine.connect() as conn:
            conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE")) 