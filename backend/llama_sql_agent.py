from fastapi import logger
import openai
import os
from dotenv import load_dotenv
from database import get_table_metadata
from functools import lru_cache
# import redis
# cache = redis.Redis(host='localhost', port=6379, db=0)
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import regex as re



query_cache = {}  # Dictionary to store cached query results
CACHE_TTL = 5000  # 30 minutes cache expiration

# Load environment variables
load_dotenv()

# Set up OpenAI API Key
openai.api_key = os.getenv("OPENAI_API_KEY")

client = openai.OpenAI()



def load_schema_embeddings():
    with open('schema_embeddings.json', 'r') as f:
        try:
            schema_data = json.load(f)  # ✅ Ensure JSON is properly parsed
        except json.JSONDecodeError as e:
            raise ValueError(f"Error decoding schema_embeddings.json: {str(e)}")

    if not isinstance(schema_data, dict):
        raise TypeError(f"Expected schema embeddings to be a dictionary, but got {type(schema_data)}. Check schema_embeddings.json content.")

    return schema_data

# ✅ Ensure it is loaded correctly
schema_embeddings = load_schema_embeddings()
assert isinstance(schema_embeddings, dict), f"schema_embeddings should be a dict, but got {type(schema_embeddings)}"
print(f"schema_embeddings type: {type(schema_embeddings)}")
print(f"schema_embeddings keys: {list(schema_embeddings.keys())[:5]}")  # Print first 5 keys to confirm structure




def load_table_embeddings():
    with open('table_embeddings.json', 'r') as f:
        return json.load(f)
table_embeddings = load_table_embeddings()

def find_best_matching_table(user_input, table_embeddings):
    input_embedding = client.embeddings.create(
        input=user_input,
        model="text-embedding-ada-002"
    ).data[0].embedding

    best_table, best_score = None, -1
    for table, embedding in table_embeddings.items():
        score = cosine_similarity([input_embedding], [embedding])[0][0]
        if score > best_score:
            best_table, best_score = table, score

    return best_table

column_match_cache = {}

def find_best_column_match(user_input, schema_embeddings, table_name):
    """
    Finds the best-matching column for a user-provided term using embeddings and exact matches.
    """
    if not isinstance(schema_embeddings, dict):
        raise TypeError(f"schema_embeddings must be a dictionary, got {type(schema_embeddings)}.")

    if table_name not in schema_embeddings:
        raise ValueError(f"Table '{table_name}' not found in schema embeddings. Available: {list(schema_embeddings.keys())}")

    if not isinstance(schema_embeddings[table_name], dict):
        raise TypeError(f"Expected schema_embeddings['{table_name}'] to be a dictionary, got {type(schema_embeddings[table_name])}")

    valid_columns = list(schema_embeddings[table_name].keys())

    # ✅ Check if exact match exists
    for col in valid_columns:
        if user_input.lower() == col.lower():
            return col  # Exact match found ✅

    # ✅ Compute embedding similarity only if no exact match
    input_embedding = client.embeddings.create(
        input=user_input,
        model="text-embedding-ada-002"
    ).data[0].embedding

    best_column, best_score = None, -1
    for column, embedding in schema_embeddings[table_name].items():
        score = cosine_similarity([input_embedding], [embedding])[0][0]
        if score > best_score:
            best_column, best_score = column, score

    return best_column  # Returns the best-matching column



# def enforce_column_mapping(user_input, table_name, schema_embeddings):
#     """
#     Ensures all column names in the user input are valid.
#     If an invalid column is found, it gets replaced with the closest valid column.
#     """
#     valid_columns = schema_embeddings.get(table_name, {}).keys()
#     column_mapping = {}  # Store corrections

#     corrected_words = []
#     for word in user_input.split():
#         if word in valid_columns:
#             corrected_words.append(word)
#         else:
#             # Find the best matching column
#             best_match = find_best_column_match(word, schema_embeddings, table_name)
#             if best_match and best_match in valid_columns:
#                 print(f"[INFO] Mapping '{word}' → '{best_match}' ✅")
#                 corrected_words.append(best_match)
#                 column_mapping[word] = best_match  # ✅ Store mapping
#             else:
#                 print(f"[WARNING] Column '{word}' not found. Keeping as is. ❌")
#                 corrected_words.append(word)  # Keep it, but SQL may fail.

#     corrected_input = " ".join(corrected_words)
#     return corrected_input, column_mapping




def is_generic_message(user_input: str) -> bool:
    """
    Uses OpenAI to determine if a message is generic (non-SQL related).
    """
    client = openai.OpenAI() 

    try:
        response = client.chat.completions.create(
          model="gpt-4o-mini",
          messages=[{"role": "system", "content": "Identify whether the given message is a generic greeting or non-analytical message. Reply with 'YES' if it is generic, otherwise reply 'NO'. Strictly YES OR NO only allowed to display"},
                  {"role": "user", "content": user_input}],
          temperature=0
        )

        ai_reply = response.choices[0].message.content.strip().upper()
        return ai_reply
    
    except Exception as e:
        logger.error(f"OpenAI classification failed: {str(e)}")
        return False  # Assume it's not generic if API fails
    
# def extract_keywords(tables_metadata):
#     keywords = set()
#     for table, details in tables_metadata.items():
#         keywords.add(table)  # Add table names

#         # Handle Option 1: List of dictionaries directly under the table
#         if isinstance(details, list):
#             for column in details:
#                 if isinstance(column, dict) and 'name' in column:
#                     keywords.add(column['name'])  # Add column names
        
#         # Handle Option 2: Columns nested under 'columns' key
#         elif isinstance(details, dict) and 'columns' in details:
#             for column in details['columns']:
#                 if isinstance(column, dict) and 'name' in column:
#                     keywords.add(column['name'])  # Add column names
#     return list(keywords)


# @lru_cache(maxsize=1)  # Cache the result for performance
# def get_schema_embeddings(schema_keywords, client):
#     response = client.embeddings.create(
#         model="text-embedding-ada-002",
#         input=schema_keywords
#     )
#     return [e['embedding'] for e in response['data']]

# def find_best_match(user_input, schema_keywords, schema_embeddings, client):
#     user_embedding = client.embeddings.create(
#         model="text-embedding-ada-002",
#         input=[user_input]
#     )['data'][0]['embedding']
    
#     similarities = cosine_similarity([user_embedding], schema_embeddings)[0]
#     best_match_index = np.argmax(similarities)
#     best_match = schema_keywords[best_match_index]
#     return best_match

# def preprocess_user_input(user_input, schema_keywords, schema_embeddings):
#     words = user_input.split()
#     processed_words = []
#     for word in words:
#         best_match = find_best_match(word, schema_keywords, schema_embeddings)
#         processed_words.append(best_match)
#     return " ".join(processed_words)

# def preprocess_user_input(user_input):
#     best_table = find_best_matching_table(user_input, table_embeddings)
#     best_column = find_best_column_match(user_input, schema_embeddings, best_table)

#     # Explicitly format for SQL query generation
#     processed_input = re.sub(
#         fr"\b({best_column})\b", f"`{best_table}`.`{best_column}`", user_input, flags=re.I
#     )

#     return processed_input

# def validate_column_names(table_name, columns, schema_embeddings):
#     """
#     Ensure that the column names exist in the given table schema.
#     If a column is missing, find the closest match from the available schema embeddings.
#     """
#     valid_columns = schema_embeddings.get(table_name, {}).keys()
#     column_mapping = {}  # Store corrections

#     corrected_columns = []
#     for col in columns:
#         if col in valid_columns:
#             corrected_columns.append(col)
#         else:
#             # Find the best matching column
#             best_match = find_best_column_match(col, schema_embeddings, table_name)
#             if best_match and best_match in valid_columns:
#                 print(f"[INFO] Mapping '{col}' to '{best_match}' based on schema.")
#                 corrected_columns.append(best_match)
#                 column_mapping[col] = best_match  # Store mapping
#             else:
#                 print(f"[WARNING] Column '{col}' not found and no suitable match detected.")
#                 corrected_columns.append(col)  # Keep it, but SQL may fail.

#     return corrected_columns, column_mapping  # ✅ Return mapping to apply replacements


@lru_cache(maxsize=100)
def generate_sql_query(user_input):
    
    """
    Convert natural language to SQL using OpenAI GPT.
    """
    # cache_key = f"sql_query:{user_input}"
    # cached_sql = cache.get(cache_key)

    # if cached_sql:
    #     return cached_sql.decode('utf-8')  # 🔥 Return cached result immediately

    client = openai.OpenAI()  # Create a client instance

    # best_table = find_best_matching_table(user_input, table_embeddings)
    # words = user_input.split()
    # best_columns = [find_best_column_match(word, schema_embeddings, best_table) for word in words]
    # best_columns, column_mapping = validate_column_names(best_table, best_columns, schema_embeddings)
    # processed_input, column_mapping = enforce_column_mapping(user_input, best_table, schema_embeddings)
    # for original_col, corrected_col in column_mapping.items():
    #     processed_input = re.sub(fr"\b{original_col}\b", corrected_col, processed_input, flags=re.I)
    # # for original_col, corrected_col in column_mapping.items():
    # #     print(f"Replacing '{original_col}' with '{corrected_col}' in SQL query.")
    # #     processed_input = re.sub(fr"\b{original_col}\b", corrected_col, processed_input, flags=re.I)

    # ✅ Debug: Show updated query input
    # print(f"[DEBUG] Processed SQL Input after Fix: {processed_input}")

    # Get table metadata dynamically
    tables_metadata = get_table_metadata()
    # schema_keywords = extract_keywords(tables_metadata)
    # schema_embeddings = get_schema_embeddings(tuple(schema_keywords), client) 
    # processed_user_input = preprocess_user_input(user_input, schema_keywords, schema_embeddings, client)

    prompt_template = f"""
    You're an expert SQL generator. Given the database schema below:

    {tables_metadata}

    Generate a precise and optimized SQL query for this natural language request:
    "{user_input}"

    Follow these critical instructions carefully:

    1. **Schema Adherence**:
      - Use only exact table and column names from the schema.
      - Always enclose table and column names in backticks (`table_name`, `column_name`).

    2. **Semantic Interpretation**:
      - Detect and handle synonyms or related terms. For example:
        - "Churn" → "Cancelled", "Active" → "On Track"/"Execution", etc.
      - When uncertain, choose the closest logical equivalent available in the schema.

    3. **Joins & Relationships**:
      - Prioritize direct table columns; use JOIN only when columns are absent in the main table.
      - When JOINs are required, dynamically infer them using matching or logically related column names (e.g., Customer ID).

    3. **Aggregation and Filtering**:
      - Clearly apply GROUP BY clauses if aggregations like COUNT, AVG, SUM, etc., are used.
      - Always filter based on recent dates using `CreatedOn` if relevant, especially for usage or activity-related queries.

    4. **Handling Ambiguity**:
      - If multiple tables have similarly named columns, prefer the table whose overall context best matches the query intent.
      - If ambiguity remains, pick the most frequently relevant table based on typical database use-cases.

    5. **Query Optimization**:
      - Return distinct and non-redundant rows.
      - Always rank and filter recent records based on the `CreatedOn` column for usage or activity.

    6. **Formatting and Values**:
      - Use single quotes ('') for string literals (e.g., 'Active', 'On Track').
      - Avoid unnecessary spaces or formatting artifacts.

    7. **Output Requirements**:
      - Support responses suitable for: tables, JSON objects, summaries, and visualizations (bar, pie, line charts).
      - Ensure numeric values, percentages, or rankings are calculated accurately.

    **Important**:  
    Return **only** the finalized SQL query. **Do not** provide explanations, markdown formatting, or comments.
    """


    # prompt_template = f"""
    # Given the following database schema:

    # {tables_metadata}

    # Convert the following natural language request into an optimized SQL query:
    # "{user_input}"

    # Ensure:
    # - Use exact column names as per the schema. Check for synonym and antonym eg. Churn = Cancelled
    # - Try to search the columns in actual table before using JOIN query, if not available then use "Join"
    # - if query is about renewal use "Accounts" table join with "Customers" Table using "Customer ID"
    # - If the query involves product usage, licenses, applications (apps/Apps/Applications), processes, boards, or integrations, ensure Accounts, Customers, and Product Usages are joined correctly. Rank records based on the latest CreatedOn per Account ID, filtering only the most recent entry.Use CreatedOn to determine recent activity and exclude accounts that have created apps in the last 12 months. Ensure uniqueness across Account ID and include accounts where no product usage exists (CreatedOn IS NULL). If the query involves license usage, display Customer Name, Account ID, Total License, and Active License.    
    # - If the query involves PS projects, join Accounts, Customers, and relevant tables on Account ID or on Customer Name. Rank records by the latest CreatedOn per Account ID and filter the most recent entry. Apply conditions like filtering inactive records or restricting data to the last 12 months if prompted. Ensure uniqueness across Account ID to avoid duplicates. Display Customer Name, Account ID, and relevant stats while applying correct aggregations and filtering."    - Avoid unnecessary spaces, underscores, or formatting artifacts.
    # - Infer the correct tables and relationships dynamically from the schema.
    # - Use appropriate `JOIN` conditions based on foreign keys or common column names.
    # - If a `JOIN` is required but no foreign kcdey exists, infer the best relationship logically.
    # - Apply `GROUP BY` where required for aggregations (e.g., COUNT, SUM, AVG).
    # - Use filtering conditions properly, ensuring only relevant records are considered.
    # - Enclose all column names and table names in backticks (`) for SQL compatibility.
    # - Use single quotes (`' '`) for string values (e.g., `Status` = 'Active').
    # - Format the query for readability, but do not include markdown formatting (```sql).
    # - Return ONLY the SQL query, with no explanations, comments, or additional text.

    # Additionally Important:
    # - Ensure the query supports different output formats like:
    #   - Tabular format (rows & columns)
    #   - JSON format
    #   - Aggregated summary values
    #   - Data visualization formats like bar charts, pie charts, and line charts
    # - If a chart format is requested, structure the result to be compatible with visualization libraries like Matplotlib, Plotly, or D3.js.
    # - If percentages or rankings are relevant, calculate them within the query.
    # - Return ONLY the SQL query without any additional comments.
    # """

    # prompt_template = f"""
    #   Given the database schema:

    #   {tables_metadata}

    #   Convert the following natural language request into an optimized SQL query:
    #   "{processed_user_input}"

    #   Requirements:
    #   - Use exact column names from the schema.
    #   - Search columns within a table before using JOINs. Use JOINs if necessary.
    #   - Dynamically infer table relationships using foreign keys or column name similarities.
    #   - Use `GROUP BY` for aggregations like COUNT, SUM, or AVG.
    #   - Ensure uniqueness by primary keys or relevant identifiers.
    #   - Enclose table and column names in backticks (`) and use single quotes (' ') for string values.
    #   - Support output formats:
    #       - Tabular (rows & columns)
    #       - JSON
    #       - Aggregated summary values
    #       - Data visualizations (bar, pie, line charts)
    #   - Return ONLY the SQL query without any additional text.
    #   """
    

    

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are an expert SQL assistant."},
                {"role": "user", "content": prompt_template}],
        temperature=0
    )

    sql_query = response.choices[0].message.content.strip()
    # Remove Markdown formatting if present
    sql_query = sql_query.replace("```sql", "").replace("```", "").strip()

    # cache.setex(cache_key, 3600, sql_query)
    return sql_query
