export interface SampleContract {
  id: string;
  title: string;
  documentType: string;
  recommendedRole: string;
  description: string;
  text: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: 'sample-msa',
    title: 'Master Services Agreement (Enterprise Cloud)',
    documentType: 'Vendor/Service Agreement',
    recommendedRole: 'Client',
    description: 'Contains unilateral indemnity, uncapped IP liability, automatic 12-month renewal trap, and strict payment default penalties.',
    text: `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of October 1, 2026 ("Effective Date"), by and between Apex Cloud Infrastructure Inc., a Delaware corporation ("Vendor"), and Meridian Retail Corp. ("Client").

1. SCOPE AND SERVICES
Vendor shall provide cloud migration, continuous infrastructure monitoring, and consulting services as described in mutually executed Statements of Work (SOW). Vendor reserves the right to modify service infrastructure and technical specifications unilaterally upon ten (10) calendar days prior electronic notice.

2. FEES AND PAYMENT TERMS
Client shall pay all fees outlined in each SOW within thirty (30) calendar days from the invoice date. Any overdue amount shall accrue interest at the rate of 2.5% per month or the maximum rate permissible by law, whichever is higher. Client shall be responsible for all collection costs, including reasonable attorneys' fees. If Client fails to dispute any invoice within seven (7) days of receipt, Client irrevocably waives all rights to challenge such invoice.

3. TERM AND AUTOMATIC RENEWAL
The initial term of this Agreement shall commence on the Effective Date and continue for a period of twenty-four (24) months ("Initial Term"). Thereafter, this Agreement shall automatically renew for successive twelve (12) month renewal terms, unless Client provides written notice of non-renewal at least ninety (90) days prior to the expiration of the then-current term. In the event Client terminates for convenience prior to the expiration of any term, Client shall immediately pay 100% of all remaining fees for the remainder of the term as liquidated damages.

4. INTELLECTUAL PROPERTY RIGHTS
Vendor retains all right, title, and interest in all pre-existing materials, algorithms, architectures, and any deliverables created or developed under this Agreement. Client is granted a non-exclusive, revocable, non-transferable internal license only during the term of this Agreement. All custom scripts, data pipelines, and workflow automation developed during the engagement shall remain the sole and exclusive property of Vendor.

5. INDEMNIFICATION
Client agrees to defend, indemnify, and hold harmless Vendor, its affiliates, directors, employees, and contractors from and against any and all claims, liabilities, damages, losses, costs, and expenses (including attorneys' fees) arising out of or related to Client's use of the Services, alleged infringement of third-party rights, or any breach of Client's obligations under this Agreement. Vendor shall have no obligation to indemnify Client under any circumstances.

6. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VENDOR'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL BE STRICTLY CAPPED AT THE LESSER OF FIVE HUNDRED DOLLARS ($500) OR THE AMOUNT ACTUALLY PAID BY CLIENT IN THE ONE (1) MONTH PRECEDING THE CLAIM. IN CONTRAST, CLIENT'S LIABILITY FOR BREACH OF CONFIDENTIALITY, IP INFRINGEMENT, OR INDEMNITY OBLIGATIONS SHALL BE UNLIMITED.

7. TERMINATION FOR CAUSE
Either party may terminate this Agreement upon written notice if the other party commits a material breach and fails to cure such breach within thirty (30) days of receiving written notice. Vendor may terminate immediately without cure period if Client fails to make any payment when due or initiates bankruptcy proceedings.

8. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of laws principles. The parties agree that any disputes arising hereunder shall be subject to mandatory binding arbitration held in Wilmington, Delaware, and each party waives any right to a jury trial or class action proceedings.

IN WITNESS WHEREOF, the authorized representatives have executed this Agreement as of the Effective Date.`,
  },
  {
    id: 'sample-lease',
    title: 'Commercial Office Lease Agreement',
    documentType: 'Lease Agreement',
    recommendedRole: 'Tenant',
    description: 'High-risk commercial lease featuring uncapped common area maintenance charges, 120-day notice requirement, and forfeiture of deposit.',
    text: `COMMERCIAL REAL PROPERTY LEASE AGREEMENT

This Commercial Lease Agreement ("Lease") is made effective as of November 1, 2026, by and between Metro Tower Properties LLC ("Landlord"), and Nexus Labs Inc. ("Tenant").

1. PREMISES AND USE
Landlord hereby leases to Tenant Suite 1400 located at 500 Market Square ("Premises"). The Premises shall be used solely for general administrative and software development offices and for no other purpose without Landlord's prior written consent.

2. TERM AND EXTENSION NOTICE
The term of this Lease shall be thirty-six (36) months commencing on December 1, 2026 ("Commencement Date"). Tenant must deliver written notice of intent to vacate or renew at least one hundred twenty (120) days prior to the expiration date. Failure to provide such notice within the exact window shall result in an automatic twelve (12) month lease extension at a 125% premium over the final month's base rent.

3. BASE RENT AND OPERATING EXPENSES (CAM)
Tenant shall pay monthly Base Rent of $14,500.00 on or before the first (1st) day of each calendar month. In addition, Tenant shall pay its proportionate share (4.8%) of all Common Area Maintenance (CAM) expenses, property taxes, capital improvements, building upgrades, and administrative overhead incurred by Landlord, with no annual ceiling or cap. Landlord shall estimate CAM monthly and reconcile annually. Tenant shall pay any CAM shortfall within fifteen (15) days of receipt of Landlord's statement, with no right to audit Landlord's underlying books.

4. SECURITY DEPOSIT
Upon signing, Tenant shall deposit $43,500.00 ("Security Deposit"). The Security Deposit is non-interest bearing. Landlord may commingle the deposit with its general operating funds. If Tenant commits any breach, Landlord may apply the entire deposit toward damages and Tenant shall replenish within five (5) business days.

5. MAINTENANCE AND SURRENDER CONDITIONS
Tenant shall keep the Premises in first-class condition at Tenant's sole expense, including HVAC servicing and window glass. Upon surrender, Tenant shall, at Landlord's sole option, restore the Premises to its original shell condition, removing all cabling, partitions, fixtures, and finishes, at Tenant's sole expense.

6. ACCESS AND INSPECTIONS
Landlord and its agents may enter the Premises at any time without notice for emergency reasons, and during normal business hours upon two (2) hours oral notice for inspections, appraisals, or prospective buyer showings.

7. ASSIGNMENT AND SUBLETTING
Tenant shall not assign this Lease or sublet the Premises without Landlord's prior written consent, which Landlord may withhold in its sole and absolute discretion. Any profits realized from any sublease shall belong 100% to Landlord.

8. GOVERNING LAW
This Lease shall be governed by the laws of the State of New York. The parties submit to the exclusive jurisdiction of the state and federal courts located in New York County.`,
  },
  {
    id: 'sample-saas',
    title: 'Enterprise SaaS Subscription & Data Agreement',
    documentType: 'Terms of Service',
    recommendedRole: 'Customer',
    description: 'SaaS terms with unilateral subscription price changes, vague uptime credits, and broad counterparty license over customer data.',
    text: `ENTERPRISE SUBSCRIPTION SERVICES AGREEMENT

This Agreement is entered into between DataMesh Systems Ltd. ("Provider") and the subscribing organization ("Subscriber") effective as of October 15, 2026.

1. SUBSCRIPTION AND ACCESS
Provider grants Subscriber a non-exclusive, non-transferable subscription to access the DataMesh analytics platform for the authorized user seat count. Provider may modify, suspend, or discontinue any feature or module of the Service at any time without liability.

2. SERVICE LEVEL AGREEMENT (SLA) AND CREDITS
Provider targets 99.5% monthly platform availability, excluding scheduled maintenance. If uptime falls below target, Subscriber's sole and exclusive remedy shall be a 5% credit applied against the next renewal invoice. Credits are non-refundable and must be claimed in writing within forty-eight (48) hours of the alleged outage.

3. DATA RIGHTS AND ANALYTICS
Subscriber retains ownership of raw data uploaded. However, Subscriber grants Provider an irrevocable, perpetual, worldwide, royalty-free license to use, aggregate, analyze, train models upon, and derive derivative intelligence from Subscriber's data, which Provider may commercialize without restriction.

4. PRICE ADJUSTMENTS
Provider reserves the unilateral right to increase subscription fees by up to 20% annually upon fifteen (15) calendar days notice. Continued use of the service following such notice constitutes unconditional acceptance of the revised pricing.

5. TERMINATION AND DATA RETURN
Upon expiration or termination, Subscriber's account shall be deactivated immediately. Provider has no obligation to preserve or export Subscriber data following termination and may permanently delete all customer data within seven (7) days of termination. Subscriber must request manual data export at least thirty (30) days prior to termination, subject to a $5,000 professional export fee.

6. DISCLAIMER OF WARRANTIES
THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE". PROVIDER DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

7. DISPUTE RESOLUTION
All disputes shall be settled through expedited arbitration in London, United Kingdom under ICC rules. Each party shall bear its own legal expenses regardless of the outcome.`,
  },
];
