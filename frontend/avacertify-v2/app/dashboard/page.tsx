"use client";

import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Copy, ExternalLink, Loader2, Search, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Certificate, certificateService } from "@/utils/blockchain";
import { fetchCertificatesByRecipient, IndexedCertificate } from "@/utils/indexerService";
import { motion } from 'framer-motion';

/**
 * Dashboard component for viewing issued certificates.
 * Fetches certificates from Envio HyperIndex GraphQL API.
 */
export default function Dashboard() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const { toast } = useToast();

  /**
   * Transform indexed certificate data to Certificate format
   */
  const transformIndexedCert = (indexed: IndexedCertificate): Certificate => ({
    id: indexed.tokenId,
    certificateId: indexed.tokenId,
    owner: indexed.recipient,
    recipientName: "NFT Certificate Holder", // Can be fetched from tokenURI metadata
    recipientAddress: indexed.recipient,
    certificateType: "NFT Certificate",
    issueDate: new Date().toISOString(), // TODO: Add timestamp to indexer schema
    institutionName: indexed.organization,
    status: "active",
    isNFT: true,
    documentUrl: indexed.tokenURI.startsWith("ipfs://")
      ? `https://gateway.pinata.cloud/ipfs/${indexed.tokenURI.replace("ipfs://", "")}`
      : indexed.tokenURI,
  });

  /**
   * Fetch certificates from the Envio indexer for the connected wallet
   * Requires a wallet address - will not fetch anything without one
   */
  const fetchCertificatesFromIndexer = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    try {
      // Fetch only certificates for the connected wallet
      const indexedCerts = await fetchCertificatesByRecipient(walletAddress);

      // Transform to Certificate[] format
      const certs: Certificate[] = indexedCerts.map(transformIndexedCert);

      setCertificates(certs);
      setFilteredCertificates(certs);

      if (certs.length === 0) {
        toast({
          title: "No Certificates Found",
          description: "You don't have any certificates yet.",
        });
      } else {
        toast({
          title: "Certificates Loaded",
          description: `Loaded ${certs.length} certificate(s) for your wallet`,
        });
      }
    } catch (error: unknown) {
      console.error("Failed to fetch from indexer:", error);
      toast({
        title: "Error Loading Certificates",
        description: error instanceof Error ? error.message : "Failed to fetch certificates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Filters certificates based on search query
   */
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setFilteredCertificates(certificates);
      return;
    }

    const filtered = certificates.filter((cert: Certificate) =>
      cert.recipientName?.toLowerCase().includes(query) ||
      cert.certificateType?.toLowerCase().includes(query) ||
      cert.institutionName?.toLowerCase().includes(query) ||
      cert.id?.toLowerCase().includes(query) ||
      cert.recipientAddress?.toLowerCase().includes(query)
    );

    setFilteredCertificates(filtered);
  }, [searchQuery, certificates]);

  /**
   * Initialize wallet and fetch certificates on mount
   * Only fetches if wallet is connected
   */
  useEffect(() => {
    const initAndFetch = async () => {
      try {
        await certificateService.init();
        const address = await certificateService.getConnectedAddress();
        if (address) {
          setConnectedAddress(address);
          await fetchCertificatesFromIndexer(address);
        } else {
          // No wallet connected - don't fetch anything
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        setIsLoading(false);
      }
    };
    initAndFetch();
  }, [fetchCertificatesFromIndexer]);

  /**
   * Manual refresh handler - only works if wallet is connected
   */
  const handleRefresh = async () => {
    if (connectedAddress) {
      await fetchCertificatesFromIndexer(connectedAddress);
    }
  };

  /**
   * Copies text to clipboard with user feedback
   */
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  /**
   * Formats a blockchain address for display
   */
  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Opens block explorer for address
   */
  const openBlockExplorer = (address: string) => {
    const explorerUrl = `https://snowtrace.io/address/${address}`;
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Certificate Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              View all NFT certificates issued through the platform
            </p>
            {connectedAddress && (
              <p className="text-xs text-muted-foreground mt-1">
                Connected: {formatAddress(connectedAddress)}
              </p>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {isLoading && (
          <Card className="mb-6 border-dashed">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Fetching certificates from indexer...
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>NFT Certificates ({filteredCertificates.length})</span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading certificates from indexer...</p>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  {searchQuery ? "No certificates found matching your search" : "No certificates minted yet"}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-muted-foreground">
                    Certificates will appear here after they are minted
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCertificates.map((cert) => (
                  <motion.div key={cert.id}>
                    <Card
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        setSelectedCertificate(cert);
                        setIsDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {cert.certificateType || "NFT Certificate"}
                              </h3>
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                NFT
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${cert.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}>
                                {cert.status || "active"}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>
                                <span className="font-medium">Token ID:</span> {cert.id}
                              </p>
                              <p>
                                <span className="font-medium">Recipient:</span> {formatAddress(cert.recipientAddress)}
                              </p>
                              <p>
                                <span className="font-medium">Organization:</span> {formatAddress(cert.institutionName)}
                              </p>
                            </div>
                          </div>
                          <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Certificate Details</DialogTitle>
              <DialogDescription>
                Complete information about the selected NFT certificate
              </DialogDescription>
            </DialogHeader>
            {selectedCertificate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Token ID</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm font-mono truncate">{selectedCertificate.id}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedCertificate.id, "Token ID")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className="text-sm font-medium mt-1 capitalize">
                      {selectedCertificate.status || "active"} (NFT)
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Recipient Address</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm font-mono truncate">{selectedCertificate.recipientAddress}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedCertificate.recipientAddress, "Recipient Address")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openBlockExplorer(selectedCertificate.recipientAddress)}
                      title="View on Snowtrace"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Organization</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm font-mono truncate">{selectedCertificate.institutionName}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedCertificate.institutionName, "Organization")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openBlockExplorer(selectedCertificate.institutionName)}
                      title="View on Snowtrace"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedCertificate.documentUrl && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Token URI / Metadata</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <a
                        href={selectedCertificate.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center"
                      >
                        View Metadata
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}