# User Verification System - Tennis Marketplace

## Overview

The Tennis Marketplace verification system builds trust between buyers and sellers by validating user identities and business credentials. Verified users receive a blue checkmark badge and enhanced credibility in the marketplace.

## Verification Criteria

### Individual Sellers

**Required Documents:**
1. **Government-issued ID** (one of the following):
   - Philippine Driver's License
   - Philippine Passport
   - Unified Multi-Purpose ID (UMID)
   - Social Security System (SSS) ID
   - Government Service Insurance System (GSIS) e-Card
   - Postal ID

2. **Proof of Address** (not older than 3 months):
   - Utility bill (electric, water, internet)
   - Bank statement
   - Credit card statement
   - Barangay certificate of residency

**Optional but Recommended:**
- Phone number verification via SMS
- Email verification
- Social media profile links (Facebook, Instagram)

### Business/Professional Sellers

**Required Documents (in addition to individual requirements):**
1. **Business Registration**:
   - Department of Trade and Industry (DTI) registration
   - Securities and Exchange Commission (SEC) certificate
   - Business permit from local government unit

2. **Tax Documents**:
   - Bureau of Internal Revenue (BIR) registration
   - Tax Identification Number (TIN)

**For Sports Equipment Dealers:**
- Authorized dealer certificates from tennis brands
- Physical store address verification
- Business license for sporting goods retail

## Eligibility Requirements

### Automatic Eligibility
Users become eligible for verification when they meet ALL of the following:
- Account age: minimum 30 days
- Complete profile information (name, phone, location)
- No recent violations or suspensions
- Valid email address (verified)

### Enhanced Eligibility (Fast-track Review)
Users with the following receive priority review:
- Active subscription (Basic or Pro)
- 10+ successful transactions with positive ratings
- High seller rating (4.0+ stars with 20+ reviews)
- No disputes or returns in the last 6 months

## Verification Process

### User-Initiated Request
1. User clicks "Get Verified" in profile
2. System checks eligibility requirements
3. User uploads required documents
4. System validates document formats and sizes
5. Request submitted to admin review queue

### Admin Review Process
1. **Initial Validation** (automated):
   - Document format check
   - File size and quality validation
   - OCR text extraction for basic info verification

2. **Manual Review** (admin):
   - Document authenticity verification
   - Cross-reference with user profile data
   - Check for any red flags or inconsistencies

3. **Decision Making**:
   - **Approve**: User receives verified status immediately
   - **Reject**: User notified with specific reasons
   - **Request More Info**: Additional documents requested

### Review Timeline
- **Standard Review**: 3-5 business days
- **Fast-track Review**: 1-2 business days (for enhanced eligibility users)
- **Priority Review**: 24 hours (for Pro subscribers)

## Verification Statuses

### Status Types
- `none`: User has not requested verification
- `pending`: Verification request under review
- `approved`: User is verified ✅
- `rejected`: Request rejected with reasons provided

### Status Display
- **Verified Users**: Blue checkmark badge on profile and listings
- **Pending**: Yellow clock icon with "Under Review" text
- **Rejected**: Red X with option to reapply after 30 days

## Document Requirements

### Format Requirements
- **File Types**: JPG, PNG, PDF
- **File Size**: Maximum 5MB per document
- **Resolution**: Minimum 1024x768 pixels
- **Quality**: Clear, readable, no blurriness

### Security Measures
- All documents encrypted at rest
- Access logged and monitored
- Automatic deletion after 90 days (approved cases)
- Retention for 1 year (rejected cases for appeal purposes)

## Benefits of Verification

### For Verified Sellers
- Blue verification badge on profile and listings
- Higher search ranking and visibility
- Increased buyer trust and conversion rates
- Access to premium selling features
- Priority customer support

### For Buyers
- Easy identification of trusted sellers
- Reduced risk of fraud or scams
- Better customer service experience
- Confidence in high-value purchases

## Rejection Reasons

### Common Rejection Reasons
1. **Document Quality Issues**:
   - Blurry or unreadable images
   - Incomplete documents
   - Documents not in English or Filipino

2. **Information Mismatch**:
   - Name doesn't match profile
   - Address discrepancies
   - Phone number inconsistencies

3. **Document Validity Issues**:
   - Expired documents
   - Invalid or fake documents
   - Documents from unsupported regions

4. **Account Issues**:
   - Recent violations or suspensions
   - Incomplete profile information
   - Suspicious account activity

### Appeal Process
Users can appeal rejected verifications by:
1. Addressing the rejection reasons
2. Uploading corrected documents
3. Waiting 30-day cooling period
4. Resubmitting verification request

## Verification Maintenance

### Regular Reviews
- Verified status reviewed annually
- Random document re-verification
- Status revoked for policy violations

### Status Revocation
Verification can be revoked for:
- Terms of service violations
- Fraudulent activity
- Customer complaints with evidence
- Failure to maintain account standards

## Implementation Phases

### Phase 1 (Current)
- ✅ Basic verification infrastructure
- ✅ Document upload system
- ✅ Admin review interface
- ✅ User profile integration

### Phase 2 (Future)
- OCR document validation
- SMS phone verification
- Integration with government ID APIs
- Automated fraud detection

### Phase 3 (Advanced)
- Video call verification for high-value sellers
- Blockchain verification records
- Third-party identity verification services
- International document support

## Success Metrics

### Target Goals
- 25% of active sellers verified within 6 months
- 90%+ user satisfaction with verification process
- <5% false positive rate in document validation
- Average review time under 3 business days

### KPIs to Track
- Verification request volume
- Approval/rejection rates
- Review time averages
- User satisfaction scores
- Impact on transaction conversion rates

## Support and FAQs

### Common Questions
**Q: How long does verification take?**
A: Standard review takes 3-5 business days. Pro subscribers get priority review within 24 hours.

**Q: What documents do I need?**
A: Government ID and proof of address. Business sellers need additional permits and registrations.

**Q: Can I use foreign documents?**
A: Currently only Philippine documents are accepted. International support planned for Phase 3.

**Q: What if my verification is rejected?**
A: You'll receive specific reasons and can reapply after 30 days with corrected documents.

**Q: Is verification mandatory?**
A: No, but verified sellers have significant advantages in visibility and buyer trust.

## Contact Information

For verification support:
- Email: verification@tennismarket.ph
- Support ticket system in user dashboard
- FAQ section in help center

---

**Last Updated**: January 2025
**Version**: 1.0
**Next Review**: March 2025