import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, ScanLine, CheckCircle, XCircle, Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/security/gate-passes/scanner")({
  component: QRScanner,
});

function QRScanner() {
  const [qrData, setQrData] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const verifyQR = async () => {
    if (!qrData.trim()) {
      toast.error("Please enter or scan a QR code");
      return;
    }

    try {
      const response = await apiClient.post("/gate-passes/verify-qr", { qr_code_data: qrData });
      if (response.error) throw new Error(response.error);
      
      setScanResult(response.data);
      toast.success("QR code verified");
    } catch (error: any) {
      setScanResult({ error: error.message || "Invalid QR code" });
      toast.error("Verification failed");
    }
  };

  const simulateScan = () => {
    setIsScanning(true);
    // Simulate camera scan - in production this would use a QR library
    setTimeout(() => {
      setQrData("GP-2026-000123|" + Math.random().toString(36).substr(2, 9));
      setIsScanning(false);
      toast.info("QR code captured - click Verify");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">QR Scanner</h1>
        <p className="text-muted-foreground">Scan or enter gate pass QR code to verify</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scan Gate Pass
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
            {isScanning ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-pulse">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Scanning...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <QrCode className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Camera preview</p>
                <Button variant="outline" size="sm" onClick={simulateScan}>
                  <Camera className="h-4 w-4 mr-2" />
                  Simulate Scan
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Or enter QR code manually:</label>
            <div className="flex gap-2">
              <Input
                placeholder="GP-2026-000123|abc123..."
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
              />
              <Button onClick={verifyQR}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scanResult.error ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Verification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanResult.error ? (
              <p className="text-red-500">{scanResult.error}</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Control #</span>
                  <span className="font-mono font-medium">{scanResult.control_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee</span>
                  <span>{scanResult.employee?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>{scanResult.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span>{scanResult.trip?.destination || "-"}</span>
                </div>
                {scanResult.status === 'pending_security' && (
                  <Button className="w-full mt-4" onClick={() => {
                    toast.success("Gate pass released");
                  }}>
                    Release Gate Pass
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}