import os
import pandas as pd
from dotenv import load_dotenv
from postgre_util import PostgreUtil
from sqlalchemy import text

class SqlUtils:
    def __init__(self):
        load_dotenv()
        self.pg_util = PostgreUtil()
        self.create_table_csv_path = os.getenv('CREATE_TABLE_CSV_PATH') or ''
        self.export_table_csv_path = os.getenv('EXPORT_TABLE_CSV_PATH') or ''
        self.users_table = os.getenv('POSTGRES_USERS_TABLE') or ''

    def create_table_from_csv(self, csv_path=None, table_name=None, drop=False):
        csv_path = csv_path if csv_path is not None else self.create_table_csv_path
        table_name = table_name if table_name is not None else self.users_table
        df = pd.read_csv(str(csv_path))
        columns = ', '.join([f'"{col}" TEXT' for col in df.columns])
        create_query = f'CREATE TABLE IF NOT EXISTS {table_name} ({columns});'
        self.pg_util.create_table_query(create_query, drop=drop)
        # Insert data
        df.to_sql(table_name, self.pg_util.engine, if_exists='replace', index=False)

    def export_table_to_csv(self, table_name=None, export_path=None):
        table_name = table_name if table_name is not None else self.users_table
        export_path = export_path if export_path is not None else self.export_table_csv_path
        query = f'SELECT * FROM {table_name}'
        df = pd.read_sql(query, self.pg_util.engine)
        export_dir = os.path.dirname(str(export_path))
        os.makedirs(export_dir, exist_ok=True)
        df.to_csv(str(export_path), index=False)

    def export_all_tables_to_csv(self, export_dir=None):
        export_dir = export_dir if export_dir is not None else os.path.dirname(self.export_table_csv_path)
        with self.pg_util.engine.connect() as conn:
            tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            for (table_name,) in tables:
                export_path = os.path.join(export_dir, f"{table_name}.csv")
                self.export_table_to_csv(table_name=table_name, export_path=export_path) 