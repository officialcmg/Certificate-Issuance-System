import assert from "assert";
import { 
  TestHelpers,
  OrganizationNFTCertificate_Approval
} from "generated";
const { MockDb, OrganizationNFTCertificate } = TestHelpers;

describe("OrganizationNFTCertificate contract Approval event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for OrganizationNFTCertificate contract Approval event
  const event = OrganizationNFTCertificate.Approval.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("OrganizationNFTCertificate_Approval is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await OrganizationNFTCertificate.Approval.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualOrganizationNFTCertificateApproval = mockDbUpdated.entities.OrganizationNFTCertificate_Approval.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedOrganizationNFTCertificateApproval: OrganizationNFTCertificate_Approval = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      owner: event.params.owner,
      approved: event.params.approved,
      tokenId: event.params.tokenId,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualOrganizationNFTCertificateApproval, expectedOrganizationNFTCertificateApproval, "Actual OrganizationNFTCertificateApproval should be the same as the expectedOrganizationNFTCertificateApproval");
  });
});
