# AI Data Analyst 🤖📊

Transform natural language questions into SQL queries, visualize data, and interact with your database through an intuitive AI-powered interface.

## UI Gallery 🖼️

<div align="center">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0;">
    <!-- Row 1 -->
    <img src="/Screenshot%202025-02-25%20at%2012.40.14 PM.png" alt="Database Connection UI" style="width:100%; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
    <img src="/Screenshot%202025-02-25%20at%2012.40.28 PM.png" alt="Connection Settings" style="width:100%; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
    <img src="/Screenshot%202025-02-25%20at%2012.40.40 PM.png" alt="Query Interface" style="width:100%; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
    <!-- Row 2 -->
    <img src="/Screenshot%202025-02-25%20at%202.03.27 PM.png" alt="Data Visualization" style="width:100%; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
    <img src="/Screenshot%202025-04-03%20at%2011.18.07 AM.png" alt="Chat Interface" style="width:100%; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
    <img src="/Screenshot%202025-04-03%20at%2011.18.26 AM.png" alt="Response Formats" style="width:100%; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
  </div>
  <em>From left to right: Connection UI, Settings Panel, Query Interface, Visualization Examples, Chat Experience, and Multiple Output Formats</em>
</div>

## Features ✨
- **Natural Language Processing**: Ask questions in plain English
- **Multi-Database Support**: Connect MySQL, PostgreSQL, SQL Server, and Oracle
- **Smart SQL Generation**: GPT-4 powered query conversion
- **Visualization Ready**: Automatic charts, tables, and JSON formatting
- **Secure Connections**: Encrypted database credentials
- **Real-time Chat**: Interactive conversation interface

## Tech Stack ⚙️
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + OpenAI API
- **Database**: Firebase (for chat history)
- **Embeddings**: text-embedding-ada-002
- **Visualization**: Plotly (via OpenAI function calling)

## Installation 🛠️

1. Clone repository:
```bash
git clone https://github.com/MayaDispeler/AI-Data-Analyst.git
cd AI-Data-Analyst
```
2. Frontend Setup
```bash
cd frontend
npm install
```
3. Backend setup
```bash
cd ../backend
pip install -r requirements.txt
```
4. Create .env file

## Usage 🚀
1. Start backend
```bash
cd backend && uvicorn main:app --reload
```
2. Start frotend
```bash
cd frontend && npm run dev
```
3.Connect your database
Navigate to /database-setup
Enter connection details
Test connection

4. Ask questions in chat
```
"Show monthly sales trends as a bar chart"
"Top 10 customers by revenue last quarter"
"Average order value by product category"
```

## Database Support 🗃️

| Database    | Port  | Status |
|-------------|-------|--------|
| MySQL       | 3306  | ✅     |
| PostgreSQL  | 5432  | ✅     |
| SQL Server  | 1433  | ✅     |
| Oracle      | 1521  | ✅     |

## Contributing 🤝
Fork the project
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit changes (git commit -m 'Add some AmazingFeature')
Push to branch (git push origin feature/AmazingFeature)
Open a Pull Request
