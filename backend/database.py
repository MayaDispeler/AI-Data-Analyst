# Import necessary modules
import logging
import sys
import os
from dotenv import load_dotenv
import pymysql
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
from  sqlalchemy import inspect
import json


def get_db():
    """
    Get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# def get_table_metadata():
#     """
#     Retrieves database table schema metadata.
#     """
#     inspector = inspect(engine)
#     tables_metadata = {}

#     for table_name in inspector.get_table_names():
#         columns = inspector.get_columns(table_name)
#         tables_metadata[table_name] = [col["name"] for col in columns]

#     return tables_metadata

def get_table_metadata():
    """Cache schema metadata to a JSON file or Redis."""
    cache_file = "schema_cache.json"

    # Load from cache if exists
    if os.path.exists(cache_file):
        with open(cache_file, "r") as f:
            return json.load(f)

    # Fetch metadata from DB
    inspector = inspect(engine)
    tables_metadata = {
        table: [col["name"] for col in inspector.get_columns(table)]
        for table in inspector.get_table_names()
    }

    # Store in cache
    with open(cache_file, "w") as f:
        json.dump(tables_metadata, f)

    return tables_metadata

# Configure logging
logging.basicConfig(stream=sys.stdout, level=logging.INFO, force=True)
logging.getLogger().addHandler(logging.StreamHandler(stream=sys.stdout))

# Load environment variables from .env file
load_dotenv()

# Database configuration
db_config = {
    "db_host": os.getenv("DB_HOST", "localhost"),
    "db_port": os.getenv("DB_PORT", "3307"),  # Default MySQL port is 3306
    "db_user": os.getenv("DB_USER"),
    "db_password": os.getenv("DB_PASSWORD"),
    "db_name": os.getenv("DB_NAME"),
}

# Construct connection string for SQLAlchemy
connection_string = (
    f"mysql+pymysql://{db_config['db_user']}:{db_config['db_password']}"
    f"@{db_config['db_host']}:{db_config['db_port']}/{db_config['db_name']}"
)

# Create SQLAlchemy engine
# Create a connection pool for SQLAlchemy engine
engine = create_engine(
    connection_string,
    pool_size=20,  # Increase to 20 for high concurrency
    max_overflow=40,  # Allow 40 temporary connections
    pool_recycle=180,  # Reduce recycle time to 3 min
    pool_pre_ping=True  # Ensure connection validity
)


# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Test the connection using raw SQL
try:
    with engine.connect() as connection:
        result = connection.execute(text("SHOW TABLES"))
        print("✅ Database Connection Successful! Available Tables:")
        # for row in result:
        #     print(row)
except Exception as e:
    print(f"❌ Database Connection Failed: {str(e)}")
