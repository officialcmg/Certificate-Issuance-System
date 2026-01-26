// utils/indexerService.ts
// Envio HyperIndex GraphQL client for fetching indexed certificate events

export const INDEXER_GRAPHQL_URL =
    process.env.NEXT_PUBLIC_INDEXER_URL ||
    "https://indexer.dev.hyperindex.xyz/7ead2b4/v1/graphql";

// Types matching the GraphQL schema
export interface IndexedCertificate {
    id: string;
    organization: string;
    recipient: string;
    tokenId: string;
    tokenURI: string;
}

export interface IndexedOrganization {
    id: string;
    organization: string;
    logoUrl: string;
    brandColor: string;
}

export interface IndexedTransfer {
    id: string;
    from: string;
    to: string;
    tokenId: string;
}

// GraphQL Queries
const GET_ALL_CERTIFICATES = `
  query GetAllCertificates {
    OrganizationNFTCertificate_CertificateMinted(
      order_by: { tokenId: desc }
    ) {
      id
      organization
      recipient
      tokenId
      tokenURI
    }
  }
`;

const GET_CERTIFICATES_BY_RECIPIENT = `
  query GetCertificatesByRecipient($recipient: String!) {
    OrganizationNFTCertificate_CertificateMinted(
      where: { recipient: { _eq: $recipient } }
      order_by: { tokenId: desc }
    ) {
      id
      organization
      recipient
      tokenId
      tokenURI
    }
  }
`;

const GET_ORGANIZATIONS = `
  query GetOrganizations {
    OrganizationNFTCertificate_OrganizationRegistered {
      id
      organization
      logoUrl
      brandColor
    }
  }
`;

const GET_TRANSFERS_BY_TOKEN = `
  query GetTransfersByToken($tokenId: numeric!) {
    OrganizationNFTCertificate_Transfer(
      where: { tokenId: { _eq: $tokenId } }
      order_by: { id: desc }
    ) {
      id
      from
      to
      tokenId
    }
  }
`;

/**
 * Execute a GraphQL query against the Envio indexer
 */
async function executeQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(INDEXER_GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            variables: variables || {},
        }),
    });

    if (!response.ok) {
        throw new Error(`Indexer request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0]?.message || "Unknown error"}`);
    }

    return result.data;
}

/**
 * Fetch all minted certificates from the indexer
 */
export async function fetchAllCertificates(): Promise<IndexedCertificate[]> {
    const data = await executeQuery<{
        OrganizationNFTCertificate_CertificateMinted: IndexedCertificate[];
    }>(GET_ALL_CERTIFICATES);

    return data.OrganizationNFTCertificate_CertificateMinted;
}

/**
 * Fetch certificates for a specific recipient address
 */
export async function fetchCertificatesByRecipient(
    recipientAddress: string
): Promise<IndexedCertificate[]> {
    const data = await executeQuery<{
        OrganizationNFTCertificate_CertificateMinted: IndexedCertificate[];
    }>(GET_CERTIFICATES_BY_RECIPIENT, {
        recipient: recipientAddress.toLowerCase()
    });

    return data.OrganizationNFTCertificate_CertificateMinted;
}

/**
 * Fetch all registered organizations
 */
export async function fetchOrganizations(): Promise<IndexedOrganization[]> {
    const data = await executeQuery<{
        OrganizationNFTCertificate_OrganizationRegistered: IndexedOrganization[];
    }>(GET_ORGANIZATIONS);

    return data.OrganizationNFTCertificate_OrganizationRegistered;
}

/**
 * Fetch transfer history for a specific token
 */
export async function fetchTransfersByToken(
    tokenId: string
): Promise<IndexedTransfer[]> {
    const data = await executeQuery<{
        OrganizationNFTCertificate_Transfer: IndexedTransfer[];
    }>(GET_TRANSFERS_BY_TOKEN, {
        tokenId: parseInt(tokenId)
    });

    return data.OrganizationNFTCertificate_Transfer;
}

/**
 * Get the current owner of a token by checking transfer history
 */
export async function getCurrentOwner(tokenId: string): Promise<string | null> {
    const transfers = await fetchTransfersByToken(tokenId);
    if (transfers.length === 0) return null;
    return transfers[0].to; // Most recent transfer's recipient
}
