# UCC — MongoDB Schema & ER Design

FHIR-aligned (D-14) translation of the UCC_14_15 entity model to MongoDB. One Mongoose model per collection; embedded sub-documents where access is always parent-scoped; references elsewhere.

## Collections

| Collection | Key fields (→ FHIR) | Notes / indexes |
|------------|--------------------|-----------------|
| `users` | role (8-enum), email, passwordHash, name, phone, locationId, status, mfaEnabled, languagePref, notificationPrefs, physician{type, specialty, licenseNo(RETHUS), privileges[], signatureRef}, nurse{license, zones[], modes[], procedures[]} | unique email+role; role+locationId index |
| `patients` (→ Patient) | userId?, name, dob, sex, idType(CC/CE/TI/PA/PEP-PPT/NIT), idNumber, addresses[{department, city, line1, neighbourhood, lat, lng}], phone, email, language, attribution{utmSource, utmMedium, utmCampaign, utmContent, gclid, referralUrl, landingPage, deviceType}, marketingConsent{email, whatsapp, sms}, suppression flags | text index on name/idNumber; attribution set at signup/booking |
| `dependents` | guardianPatientId, name, relationship, dob, idType?, idNumber? | index guardianPatientId |
| `consents` (→ Consent) | patientId, caseId?, type(habeas_data/general_care/minor_procedure/medication/iv/wound_care/sample_collection/recording/share), version, signature{method, imageRef?, signedBy, witness?}, acceptedAt, revokedAt? | immutable append-only |
| `hospitals` (→ Location/Organization) | name, city(Medellín/Cartagena/Bogotá), address, lat, lng, serviceRadiusKm, repsCode, services[{cupsCode, name, habilitationRef}], status | city index |
| `cases` (→ Encounter) | bookingId, patientId, dependentId?, physicianId?, coordinatorId?, hospitalId, modality(in_office/telehealth/at_home), status (state machine), stage(1–12), priorityFlag, source, declineHistory[{physicianId, reason, at}], escalation? | status+coordinatorId, status+physicianId, patientId indexes |
| `bookings` | patientId, items[{patientOrDependent, serviceCode, physicianId?, slot}], city, modality, preauth{paymentId, status}, slotHold{heldUntil}, status | slot uniqueness enforced via `appointments` |
| `appointments` | caseId, physicianId, slot{start, end}, type, status, reminders[] | unique physicianId+slot.start (double-booking lock) |
| `intakes` | caseId, symptoms, goals, files[{type, name, storageRef, scanned}] | |
| `clinicalCharts` (→ Composition) | caseId, steps{1..12: {payload, completedAt, by}}, hardStops[1,2,9,12], status(draft/sealed), sealedAt, signature, addenda[{text, signedBy, at}] | sealed ⇒ immutable except addenda |
| `prescriptions` (→ MedicationRequest) | caseId, physicianId, items[{medicineId, dose, schedule, food, durationDays}], language(es/en/bilingual), pdfRef, controlled, signedAt | controlled ⇒ recetario oficial flag |
| `medicines` | name, form, strength, cumCode | text index |
| `orders` (→ ServiceRequest) | caseId, type(lab/imaging/specialist/nurse_procedure/therapy/follow_up/certificate/medical_leave), cupsCode?, description, priority(red/orange/yellow/green/blue), timeframe, targetRole, status(pending/quoted/paid/scheduled/in_progress/completed/cancelled), execution{vendor?, scheduledAt?, resultRef?, notes} | caseId, status+priority indexes |
| `quotes` | caseId, orderIds[], lines[{label, catalogPrice, markup, total}], ocrDoc{fileRef, parsed}, status(draft/sent/accepted/paid/declined/expired), reviewedBy, sentAt | |
| `catalog` | serviceCode(CUPS), name, category, basePrice, markupPolicy, active | |
| `coverages` (→ Coverage) | patientId, type(EPS/Prepagada/Póliza/Particular), payer, memberId, status | |
| `claims` (→ Claim) | caseId, payer, billed, copay, status(submitted/glosa/appealed/paid/denied), history[] | flag `claims.enabled` |
| `invoices` | caseId, number, lines[], subtotal, copay?, total (COP), status(issued/paid/void), cufe?, cuv?, xmlRef?, pdfRef, paymentId? | number unique |
| `payments` | caseId?, invoiceId?, quoteId?, type(preauth/capture/refund), amount, method{savedCardId?}, gatewayRef, idemKey, status | idemKey unique |
| `savedCards` | patientId, gatewayToken, brand, last4 | PCI: token only |
| `messages` | caseId, threadType(case/wholesale/support), from{userId, role}, channel(in_app/whatsapp/email/phone/live_chat), body, attachments[], internal(bool), at | caseId+at index; internal hidden from patients |
| `notifications` | userId, event, title, body, channel, status(queued/sent/read/failed), retries, sentAt | userId+status index |
| `tasks` | caseId?, assigneeId, type, due, slaHours, status, escalatedTo? | assigneeId+status+due index |
| `nurseJobs` | orderId, caseId, zone{city, area}, broadcast{at, timeoutMin, acceptedBy?, acceptedAt?}, status(open/accepted/en_route/arrived/started/completed/cancelled), visit{startedAt, endedAt, materials[], tolerance, complications, adverseEvents[{severity, narrative, at}]}, compensation{serviceRate, travelFee, status} | atomic accept via findOneAndUpdate status:open |
| `wholesaleBuyers` | inviteToken, businessName, entityType, rut, representative, addresses, contact, documents[], status(pending/active/suspended/under_review/credit_hold/closed), approvedBy? | |
| `wholesaleOrders` | buyerId, items[{sku, qty, price}], shippingAddress, payment{status}, fulfillment{status: alert/picking/packing/dispatched/delivered, packingSlipRef?, manifestRef?, labelRef?}, tracking[], incidents[{type, description, imageRefs[], resolution, status}] | |
| `products` | sku, name, category, price, stock, reorderLevel, regulatoryNotes, qrCode | sku unique |
| `dispenseRequests` | prescriptionId, patientId, status(queued/preparing/ready/dispensed), dispensedBy?, at | fulfillment portal |
| `inventoryItems` | locationId, itemName, qty, reorderLevel, qrCode, movements[{dir(in/out), qty, by, at, location}] | office-manager + fulfillment |
| `campaigns` | name, status, trigger(event enum), steps[{delayHours, channel, templateId, condition?}], segmentId?, stats{sent, opened, converted} | |
| `segments` | name, rules[{field, op, value}], size | |
| `promoCodes` | code, type(percent/fixed), value, limit, used, active | |
| `attributionEvents` | patientId?, sessionId, utm*, gclid, referralUrl, landingPage, deviceType, at, convertedBookingId? | marketing analytics |
| `cmsContents` | scope(system/marketing), key, locale(es/en), title, body, ownerRole, updatedBy, version | ownership: OM owns, Marketing executes |
| `settings` | key, value, scope, updatedBy | Decisions-Assumed defaults live here |
| `featureFlags` | key, enabled, scope | rips.enabled, esign.advanced, claims.enabled… |
| `auditLogs` | actorId, actorRole, action, entity{type, id}, before?, after?, justification?, sessionInfo{ip, device}, at | **append-only**; TTL disabled; retention 5+10y policy field |

## Key relationships (ER)

```
patients 1—* dependents            patients 1—* coverages
patients 1—* cases *—1 hospitals   cases 1—1 bookings
cases 1—1 clinicalCharts           cases 1—* orders 1—0..1 nurseJobs
cases 1—* prescriptions 1—* dispenseRequests
orders *—1 quotes                  cases 1—1 invoices 1—* payments
cases 1—* messages / tasks / consents
wholesaleBuyers 1—* wholesaleOrders *—* products
campaigns *—1 segments             users(role=nurse) 1—* nurseJobs
```

## Indexing strategy

Compound indexes on every scoped list query (`role-scope + status + date`), unique constraints for slot locking, idempotency, SKU, invoice numbers; text indexes for patient and medicine search (<3s dashboards, fast search requirement).
