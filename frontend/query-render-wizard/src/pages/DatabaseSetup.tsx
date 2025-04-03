import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database } from 'lucide-react';
import DatabaseConnection from '@/components/DatabaseConnection';

const DatabaseSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectionSuccess = () => {
    setIsConnected(true);
    // Wait a moment before redirecting to chat
    setTimeout(() => {
      navigate('/chat');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="px-8 py-6 border-b bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Database Setup
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {isConnected ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                <Database className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connection Successful!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                You're now connected to your database. Redirecting to chat...
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-2">
                <div className="sticky top-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Connect Your Database
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Connect your SQL database to start analyzing your data with AI. 
                    This allows you to run complex queries and generate insights from your data.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Why connect your database?</h3>
                    <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1 text-sm">
                      <li>Run natural language queries on your data</li>
                      <li>Generate visualizations automatically</li>
                      <li>Get AI-powered insights and analysis</li>
                      <li>Your data stays secure - connections are encrypted</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3">
                <DatabaseConnection onConnectionSuccess={handleConnectionSuccess} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DatabaseSetup; 