from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from llama_sql_agent import generate_sql_query, is_generic_message
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import io
import base64
import logging
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from rich.console import Console
from rich.table import Table  
import time
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add this new model for database connection
class DatabaseConnection(BaseModel):
    db_type: str
    db_host: str
    db_port: str
    db_name: str
    db_user: str
    db_password: str

query_cache = {}  # Dictionary to store cached query results
CACHE_TTL = 5000  # 30 minutes cache expiration

# Ensure Matplotlib works in FastAPI without GUI issues
import matplotlib
matplotlib.use("Agg")
pd.set_option('display.float_format', '{:.2f}'.format)

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check if 'tabulate' is installed for table formatting
try:
    from tabulate import tabulate
    tabulate_installed = True
except ImportError:
    tabulate_installed = False

app = FastAPI()

# Configure CORS middleware to allow requests from our frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you should specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def print_rich_table(df):
    console = Console()
    table = Table(show_header=True, header_style="bold magenta")

    for col in df.columns:
        table.add_column(col)

    for _, row in df.iterrows():
        table.add_row(*map(str, row))

    console.print(table)

# def safe_execute_query(db: Session, sql: str) -> Dict[str, Any]:
#     """Execute SQL query with error handling and return standardized results."""
#     try:
#         result = db.execute(text(sql).execution_options(stream_results=True))
#         return {
#             "success": True,
#             "rows": [dict(row._mapping) for row in result],
#             "columns": list(result.keys()),
#             "rowcount": result.rowcount
#         }
#     except Exception as e:
#         logger.error(f"Query execution failed: {str(e)}")
#         return {
#             "success": False,
#             "error": str(e),
#             "sql": sql
#         }
def get_cached_query(sql_query):
    """Retrieve from in-memory cache if valid"""
    if sql_query in query_cache:
        data, timestamp = query_cache[sql_query]
        if time.time() - timestamp < CACHE_TTL:
            return data  # Return cached data if within TTL
    return None  # Expired or not found

def safe_execute_query(db: Session, sql: str):
    """Check cache before executing query"""
    cached_result = get_cached_query(sql)
    if cached_result:
        return cached_result

    try:
        result = db.execute(text(sql))
        rows = [dict(row._mapping) for row in result]

        query_result = {"success": True, "rows": rows, "columns": list(result.keys()), "rowcount": len(rows)}

        # Cache query result with timestamp
        query_cache[sql] = (query_result, time.time())

        return query_result
    except Exception as e:
        return {"success": False, "error": str(e), "sql": sql}


@app.get("/")
def home():
    return {"message": "AI SQL Chatbot Backend is Running!"}

@app.post("/query/")
async def process_query(user_message: dict, db: Session = Depends(get_db)):
    logger.info(f"Received request: {user_message}")
    user_input = user_message.get("message", "").strip()
    response_format = user_message.get("format", "json")

    if not user_input:
        raise HTTPException(status_code=400, detail="Empty query received")
    
    try:
        if is_generic_message(user_input) == "YES":
            print("GENERIC MESSAGES")
            return {
                "message": "Hi, I am a Kissflow Data AI Agent. Only Analytics Based Questions are allowed.",
                "format": "text"
            }

        sql_query = generate_sql_query(user_input)
        logger.info(f"Generated SQL: {sql_query}")

        query_result = safe_execute_query(db, sql_query)
        logger.info(f"Query Result: {query_result}")
        if not query_result["success"]:
            raise HTTPException(status_code=400, detail=f"SQL Error: {query_result['error']}")

        if not query_result["rows"]:
            return {
                "query": sql_query,
                "format": response_format,
                "message": "No Matching Results",
                "result": []
            }

        df = pd.DataFrame(query_result["rows"])
        # df = pd.read_sql_query(text(query_result), db.bind)
        logger.info(f"DataFrame created with shape: {df.shape}")
        logger.info(f"DataFrame created : {df}")

        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col], errors='raise')
            except:
                pass

        response = {"query": sql_query, "format": response_format}
        logger.info(f"Response created : {response}")

        # ✅ Fix: Ensure Chart is Created and Returned Properly
        if response_format in ["line_chart", "bar_chart", "pie_chart"]:
            if len(df.columns) < 2:
                raise HTTPException(status_code=400, detail="Chart format requires at least 2 columns.")

            try:
                # ✅ Create the figure and axis
                fig, ax = plt.subplots(figsize=(10, 6))
                x_col, y_col = df.columns[:2]

                # ✅ Custom color palette for professional look
                colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

                if response_format == "line_chart":
                    df.plot(
                        x=x_col, 
                        y=y_col, 
                        ax=ax, 
                        marker='s',  # Square markers
                        linestyle='-', 
                        color=colors[0], 
                        linewidth=2, 
                        markersize=6
                    )
                    ax.set_title(f"{y_col} by {x_col}", fontsize=14, fontweight='bold', color="#333")

                elif response_format == "bar_chart":
                    df.plot.bar(
                        x=x_col, 
                        y=y_col, 
                        ax=ax, 
                        color=colors[1]
                    )
                    ax.set_title(f"{y_col} by {x_col}", fontsize=14, fontweight='bold', color="#333")

                elif response_format == "pie_chart":
                    df.plot.pie(
                        y=y_col, 
                        labels=df[x_col], 
                        ax=ax, 
                        autopct='%1.1f%%', 
                        colors=colors, 
                        startangle=140, 
                        wedgeprops={'edgecolor': 'white'}
                    )
                    ax.set_ylabel("")
                    ax.set_title(f"{y_col} Distribution", fontsize=14, fontweight='bold', color="#333")

                # ✅ Improve readability of X and Y axis
                ax.set_xlabel(x_col, fontsize=12, fontweight='bold', color="#555")
                ax.set_ylabel(y_col, fontsize=12, fontweight='bold', color="#555")

                # ✅ Format Y-axis numbers to avoid scientific notation
                ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{int(x):,}"))

                # ✅ Add grid for better readability
                ax.grid(visible=True, linestyle="--", alpha=0.6)

                # ✅ Add a professional legend
                ax.legend([y_col], loc="best", fontsize=12, frameon=True, edgecolor="#ccc")

                # ✅ Save chart as base64
                img_buffer = io.BytesIO()
                plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=300)  # High DPI for sharp output
                img_buffer.seek(0)
                response["chart"] = f"data:image/png;base64,{base64.b64encode(img_buffer.read()).decode()}"
                response["message"] = "Chart generated successfully."
                plt.close()
                logger.info("Chart successfully generated and encoded.")
                logger.info(f"Response updated : {response}")

            except Exception as chart_error:
                logger.error(f"Chart generation failed: {str(chart_error)}")
                response["chart"] = None

        elif response_format == "json":
            # first_row = df.iloc[0].to_dict()
            # response["message"] = f"{', '.join([f'{k}: {v}' for k, v in first_row.items()])}."
            df = df.applymap(lambda x: str(x) if isinstance(x, (dict, list)) else x)
            response["result"] = df.to_dict(orient="records")

        elif response_format == "text":
            # 1. If DataFrame has exactly 1 row and 1 column
            if df.shape == (1, 1):
                col_name = df.columns[0]
                val = df.iloc[0, 0]
                text_data = f'"{col_name}": {val}'

            # 2. Else if DataFrame has exactly 1 row but multiple columns
            elif df.shape[0] == 1:
                row = df.iloc[0]
                # e.g. "ColumnA: 123, ColumnB: ABC"
                text_data = ', '.join(f'{col}: {row[col]}' for col in df.columns)

            # 3. Otherwise, multiple rows
            else:
                text_lines = []
                for idx, row in df.iterrows():
                    line_str = ', '.join(f'{col}: {row[col]}' for col in df.columns)
                    text_lines.append(line_str)
                # Join each row's text on a newline
                text_data = '\n'.join(text_lines)

            response["result"] = text_data


        elif response_format == "table":
            if tabulate_installed:
                print("Tabulate installed")
                df = df.fillna("").replace([float('inf'), float('-inf')], None)  # Fix NaN and infinity values
                response["result"] = df.to_dict(orient="records")  # Convert DataFrame safely
            else:
                print("Tabulate Not installed")
                response["result"] = df.to_string(index=False)
        else:
            raise HTTPException(status_code=400, detail="Invalid format specified")

        return response

    except Exception as e:
        logger.error(f"Processing failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

# Store active database connections
active_connections = {}

@app.post("/connect/")
async def connect_database(connection: DatabaseConnection):
    """Connect to database using provided credentials"""
    try:
        # Log incoming connection request
        logger.info(f"Received connection request for database: {connection.db_host}:{connection.db_port}/{connection.db_name}")
        logger.info(f"Using username: {connection.db_user}")
        
        # Construct connection string
        connection_string = (
            f"mysql+pymysql://{connection.db_user}:{connection.db_password}"
            f"@{connection.db_host}:{connection.db_port}/{connection.db_name}"
        )
        logger.info("Constructed connection string (password hidden)")
        
        # Create engine with connection pooling
        engine = create_engine(
            connection_string,
            pool_size=20,
            max_overflow=40,
            pool_recycle=180,
            pool_pre_ping=True
        )
        logger.info("Created SQLAlchemy engine")
        
        # Test connection with detailed error handling
        try:
            with engine.connect() as conn:
                logger.info("Attempting to execute test query")
                # Test basic query
                result = conn.execute(text("SELECT 1"))
                logger.info("Successfully executed test query")
                
                # Get list of tables to verify database access
                logger.info("Attempting to fetch table list")
                tables = conn.execute(text("SHOW TABLES"))
                table_list = [table[0] for table in tables]
                logger.info(f"Successfully fetched {len(table_list)} tables")
                
                # Store the engine in active connections
                connection_id = f"{connection.db_host}_{connection.db_name}"
                active_connections[connection_id] = engine
                logger.info(f"Stored connection with ID: {connection_id}")
                
                return {
                    "status": "success",
                    "message": "Database connected successfully",
                    "tables_found": len(table_list),
                    "tables": table_list[:10]  # Return first 10 tables for preview
                }
        except Exception as conn_error:
            logger.error(f"Database connection error: {str(conn_error)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to connect to database: {str(conn_error)}"
            )
    except Exception as e:
        logger.error(f"General error during connection: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Connection error: {str(e)}"
        )

# Modify get_db to use the active connection
def get_db():
    """Get database session from active connection"""
    # For now, we'll use the first active connection
    # In a real app, you'd want to handle multiple connections
    if not active_connections:
        raise HTTPException(status_code=400, detail="No active database connection")
    
    engine = list(active_connections.values())[0]
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()