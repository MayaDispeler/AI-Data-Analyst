import React from "react";
import { useAuth } from "@/context/AuthContext";
import ChartRenderer from "./ChartRenderer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MessageProps {
  content: string | object;
  type: "user" | "assistant";
  name: string;
  avatar: string;
  format?: string;
  query?: string;
  chart?: string;
}

const Message: React.FC<MessageProps> = ({
  content,
  type,
  name,
  avatar,
  format,
  query,
  chart,
}) => {
  const { user } = useAuth();

  // Ensure content is always a string for text-based rendering
  const getSafeContent = () => {
    if (typeof content === "string") return content;
    if (typeof content === "object") return JSON.stringify(content, null, 2);
    return "";
  };  

  const formatJSONContent = (data: string | object) => {
    try {
      const parsedJSON = typeof data === "string" ? JSON.parse(data) : data;
      return JSON.stringify(parsedJSON, null, 2);
    } catch {
      return data;
    }
  };

  const formatTableContent = (data: string | object) => {
    try {
        let tableData;

        if (typeof data === "string") {
            // ✅ Add this check to handle "No Matching Results"
            if (data === "No Matching Results") {
                return <p>No matching results found.</p>;
            }

            // ✅ Try parsing as JSON if it's not the special message
            try {
                tableData = JSON.parse(data);
            } catch {
                console.error("Invalid JSON format:", data);
                return <p>Error processing data.</p>;
            }
        } else {
            tableData = data;
        }

        if (!Array.isArray(tableData)) {
            console.error("Table data should be an array.");
            return <p>processing table data failed.</p>;
        }

        if (tableData.length === 0) {
            return <p>No matching results found.</p>;
        }

    
      // **Dynamically Extract Column Order from First Row**
      const columnOrder = Object.keys(tableData[0]);
  
      // Convert headers into a display-friendly format
      const headers = columnOrder.map((header) => ({
        key: header,
        display: header.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      }));
  
      return (
        <div className="border rounded-lg"> 
          <Table className="border-collapse w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-300">
                {headers.map(({ display }, index) => (
                  <TableHead key={index} className="font-medium border-r border-gray-300 px-4 py-2">
                    {display}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="border-b border-gray-300">
                  {headers.map(({ key }, colIndex) => (
                    <TableCell key={`${rowIndex}-${colIndex}`} className="border-r border-gray-300 px-4 py-2">
                      {typeof row[key] === "object" ? JSON.stringify(row[key]) : row[key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    } catch (error) {
      console.error("Error formatting table:", error);
      return <p>Error displaying table.</p>;
    }
  };
  
  const messageClasses = `text-lg text-gray-800 dark:text-gray-200 text-left ${
    type === "assistant" && format ? "font-mono" : "font-sans"
  }`;

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src =
      type === "user"
        ? "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
        : "https://kissflow.com/hubfs/Logo-Verticle-Light.svg";
  };

  const avatarSrc =
    type === "user"
      ? user?.photoURL ||
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
      : avatar || "https://kissflow.com/hubfs/Logo-Verticle-Light.svg";

      const renderErrorMessage = () => {
        const safeContent = getSafeContent();
        // ✅ Ignore "No Matching Results" and only check for other errors
        if (type === "assistant" && safeContent.toLowerCase().includes("error") && safeContent !== "No Matching Results") {
            return (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-2">
                    <p className="text-red-600 dark:text-red-400">{safeContent}</p>
                </div>
            );
        }
        return null;
   };
    


  const renderContent = () => {
    if (type === "user") {
      return <p className="whitespace-pre-wrap leading-relaxed text-left font-sans">{getSafeContent()}</p>;
    }

    const errorMessage = renderErrorMessage();
    if (errorMessage) return errorMessage;

    if (type === "assistant") {
      if (format === "table" && content) {
        return (
          <div className="rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg overflow-x-auto">
              {formatTableContent(content)}
            </div>
            {query && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  Query: {query}
                </p>
              </div>
            )}
          </div>
        );
      }

      if (format === "json" && content) {
        return (
          <div className="rounded-lg overflow-hidden">
            <pre className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed">
              {formatJSONContent(content)}
            </pre>
            {query && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  Query: {query}
                </p>
              </div>
            )}
          </div>
        );
      }

      if (format?.includes("chart") && chart) {
        return (
          <div className="space-y-4 w-full max-w-4xl">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <img
                src={chart}
                alt="Generated Chart"
                className="rounded-lg max-w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = "";
                  e.currentTarget.alt = "Failed to load chart";
              }}
          />
            </div>
            {query && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  Query: {query}
                </p>
              </div>
            )}
          </div>
        );
      }

      if (format === "text") {
        return (
          <div>
            <p className="whitespace-pre-wrap leading-relaxed text-left">
              {getSafeContent()}
            </p>
            {query && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  Query: {query}
                </p>
              </div>
            )}
          </div>
        );
      }
    }

    return <p className="whitespace-pre-wrap leading-relaxed text-left">{getSafeContent()}</p>;
  };

  return (
    <div className="flex items-start space-x-4 mb-8 max-w-[90%]">
      <img
        src={avatarSrc}
        alt={`${type === "user" ? "User" : "Assistant"} Avatar`}
        className="w-12 h-12 rounded-full flex-shrink-0 mt-1 object-cover"
        onError={handleImageError}
      />
      <div className="flex-1">
        <div className={messageClasses}>{renderContent()}</div>
      </div>
    </div>
  );
};

export default Message;
