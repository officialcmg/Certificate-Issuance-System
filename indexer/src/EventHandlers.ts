/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
*/
import {
  OrganizationNFTCertificate,
  OrganizationNFTCertificate_Approval,
  OrganizationNFTCertificate_ApprovalForAll,
  OrganizationNFTCertificate_BatchMetadataUpdate,
  OrganizationNFTCertificate_CertificateMinted,
  OrganizationNFTCertificate_MetadataUpdate,
  OrganizationNFTCertificate_OrganizationRegistered,
  OrganizationNFTCertificate_RoleAdminChanged,
  OrganizationNFTCertificate_RoleGranted,
  OrganizationNFTCertificate_RoleRevoked,
  OrganizationNFTCertificate_Transfer,
} from "generated";


OrganizationNFTCertificate.CertificateMinted.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_CertificateMinted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    organization: event.params.organization,
    recipient: event.params.recipient,
    tokenId: event.params.tokenId,
    tokenURI: event.params.tokenURI,
  };

  context.OrganizationNFTCertificate_CertificateMinted.set(entity);
});

OrganizationNFTCertificate.OrganizationRegistered.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_OrganizationRegistered = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    organization: event.params.organization,
    logoUrl: event.params.logoUrl,
    brandColor: event.params.brandColor,
  };

  context.OrganizationNFTCertificate_OrganizationRegistered.set(entity);
});

OrganizationNFTCertificate.Approval.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    approved: event.params.approved,
    tokenId: event.params.tokenId,
  };

  context.OrganizationNFTCertificate_Approval.set(entity);
});

OrganizationNFTCertificate.ApprovalForAll.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_ApprovalForAll = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    operator: event.params.operator,
    approved: event.params.approved,
  };

  context.OrganizationNFTCertificate_ApprovalForAll.set(entity);
});

OrganizationNFTCertificate.BatchMetadataUpdate.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_BatchMetadataUpdate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _fromTokenId: event.params._fromTokenId,
    _toTokenId: event.params._toTokenId,
  };

  context.OrganizationNFTCertificate_BatchMetadataUpdate.set(entity);
});


OrganizationNFTCertificate.MetadataUpdate.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_MetadataUpdate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _tokenId: event.params._tokenId,
  };

  context.OrganizationNFTCertificate_MetadataUpdate.set(entity);
});


OrganizationNFTCertificate.RoleAdminChanged.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_RoleAdminChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    previousAdminRole: event.params.previousAdminRole,
    newAdminRole: event.params.newAdminRole,
  };

  context.OrganizationNFTCertificate_RoleAdminChanged.set(entity);
});

OrganizationNFTCertificate.RoleGranted.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_RoleGranted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account,
    sender: event.params.sender,
  };

  context.OrganizationNFTCertificate_RoleGranted.set(entity);
});

OrganizationNFTCertificate.RoleRevoked.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_RoleRevoked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account,
    sender: event.params.sender,
  };

  context.OrganizationNFTCertificate_RoleRevoked.set(entity);
});

OrganizationNFTCertificate.Transfer.handler(async ({ event, context }) => {
  const entity: OrganizationNFTCertificate_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    tokenId: event.params.tokenId,
  };

  context.OrganizationNFTCertificate_Transfer.set(entity);
});
