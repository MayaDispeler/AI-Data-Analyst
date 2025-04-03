import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface DatabaseConnectionProps {
  onConnectionSuccess?: () => void;
}

const DatabaseConnection: React.FC<DatabaseConnectionProps> = ({ onConnectionSuccess }) => {
  const [dbType, setDbType] = useState<string>('mysql');
  const [dbHost, setDbHost] = useState<string>('');
  const [dbPort, setDbPort] = useState<string>('');
  const [dbName, setDbName] = useState<string>('');
  const [dbUser, setDbUser] = useState<string>('');
  const [dbPassword, setDbPassword] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Set default ports based on database type
  React.useEffect(() => {
    switch (dbType) {
      case 'mysql':
        setDbPort('3306');
        break;
      case 'postgresql':
        setDbPort('5432');
        break;
      case 'sqlserver':
        setDbPort('1433');
        break;
      default:
        setDbPort('');
    }
  }, [dbType]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dbHost || !dbPort || !dbName || !dbUser) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/connect/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db_type: dbType,
          db_host: dbHost,
          db_port: dbPort,
          db_name: dbName,
          db_user: dbUser,
          db_password: dbPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to your database!",
        });
        
        if (onConnectionSuccess) {
          onConnectionSuccess();
        }
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Could not connect to the database. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An error occurred while trying to connect to the database.",
        variant: "destructive",
      });
      console.error('Error connecting to database:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Connect Your Database</CardTitle>
        <CardDescription>
          Enter your database connection details to start analyzing your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleConnect}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dbType">Database Type</Label>
              <Select 
                value={dbType} 
                onValueChange={setDbType}
              >
                <SelectTrigger id="dbType">
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                  <SelectItem value="oracle">Oracle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dbHost">Host</Label>
                <Input
                  id="dbHost"
                  placeholder="localhost"
                  value={dbHost}
                  onChange={(e) => setDbHost(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dbPort">Port</Label>
                <Input
                  id="dbPort"
                  placeholder="3306"
                  value={dbPort}
                  onChange={(e) => setDbPort(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dbName">Database Name</Label>
              <Input
                id="dbName"
                placeholder="my_database"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dbUser">Username</Label>
              <Input
                id="dbUser"
                placeholder="root"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dbPassword">Password</Label>
              <Input
                id="dbPassword"
                type="password"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
              />
            </div>
          </div>
          
          <Button className="w-full mt-4" type="submit" disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Database'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground">
        <p>Your database connection is encrypted and will only be used for this session.</p>
      </CardFooter>
    </Card>
  );
};

export default DatabaseConnection; 