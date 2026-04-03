"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, RefreshCw, Bell, Calendar, MapPin, DollarSign } from "lucide-react";

interface Event {
  event_Code: number;
  event_Name: string;
  event_Button_Text: string;
  event_Display_Date: string;
  event_Date: string;
  team_1: string;
  team_2: string;
  venue_Name: string;
  city_Name: string;
  event_Price_Range: string;
  last_updated: string;
}

interface ApiResponse {
  status: string;
  current_status: string | null;
  last_check: string | null;
  events: Event[];
}

const API_URL = "http://localhost:8000/status";

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      setData(json);
      setLastUpdated(new Date());
      setPollError(null);
    } catch (error) {
      setPollError("Failed to connect to backend");
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const isTicketLive = data?.current_status === "BOOK NOW" || data?.current_status === "BUY";

  const getStatusColor = () => {
    if (isTicketLive) return "bg-red-500";
    if (data?.current_status === "SOLD OUT") return "bg-gray-500";
    return "bg-yellow-500";
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-600">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">RCB Ticket Monitor</h1>
              <p className="text-muted-foreground">
                Real-time ticket availability tracker
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={fetchStatus}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {pollError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{pollError}</p>
            </CardContent>
          </Card>
        )}

        {data && data.events.length > 0 && (
          <Card className={isTicketLive ? "border-red-500 shadow-lg shadow-red-500/20" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{data.events[0].event_Name}</CardTitle>
                <div className={`px-4 py-2 rounded-full text-white font-bold ${getStatusColor()}`}>
                  {data.current_status || "UNKNOWN"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{data.events[0].event_Display_Date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{data.events[0].venue_Name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{data.events[0].city_Name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Price Range</p>
                    <p className="font-medium">{data.events[0].event_Price_Range}</p>
                  </div>
                </div>
              </div>

              {isTicketLive && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
                  <div className="flex items-center gap-2 text-red-500 font-bold">
                    <Bell className="w-5 h-5" />
                    <span>TICKETS ARE LIVE! BOOK NOW!</span>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground pt-4 border-t">
                Last updated: {lastUpdated?.toLocaleTimeString() || "N/A"}
              </div>
            </CardContent>
          </Card>
        )}

        {data && data.events.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">No events found</p>
            </CardContent>
          </Card>
        )}

        {loading && !data && (
          <Card>
            <CardContent className="pt-6 flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
