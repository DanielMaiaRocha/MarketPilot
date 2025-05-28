"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { getOAuthTokenAction } from "@/app/actions";
import { CheckCircle, XCircle } from "lucide-react";

interface AdAccountStatusProps {
  provider: "google_ads" | "meta_ads";
  title: string;
  description: string;
}

export default function AdAccountStatus({
  provider,
  title,
  description,
}: AdAccountStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const token = await getOAuthTokenAction(provider);
        setIsConnected(!!token);
      } catch (error) {
        console.error(`Error checking ${provider} connection:`, error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [provider]);

  const handleConnect = () => {
    window.location.href = `/api/ads/${provider.split("_")[0]}/connect`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {isConnected !== null &&
            !isLoading &&
            (isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            ))}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 animate-pulse bg-muted rounded"></div>
        ) : (
          <div className="text-sm">
            {isConnected ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <span className="text-red-600">Not connected</span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleConnect}
          variant={isConnected ? "outline" : "default"}
          disabled={isLoading}
          className="w-full"
        >
          {isConnected ? "Reconnect" : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  );
}
