# AI Data Analyst 🤖📊

Transform natural language questions into SQL queries, visualize data, and interact with your database through an intuitive AI-powered interface.

![Screenshot 1](/Screenshot%202025-04-03%20at%2011.18.07 AM.png)
![Screenshot 2](/Screenshot%202025-04-03%20at%2011.18.26 AM.png)

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
