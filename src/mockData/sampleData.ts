import type { CRMLead } from '../types/crm';
import { generateCompositeKey, sanitizePhone } from '../utils/formatters';

export const INITIAL_SAMPLE_LEADS: CRMLead[] = [
  {
    compositeKey: generateCompositeKey('U85500JK2026PTC019669', 'ABDUL AZIZ WANI', 'JAVAIDQUANTUM111@GMAIL.COM'),
    entityId: 'U85500JK2026PTC019669',
    entityType: 'company',
    name: 'DELTA GROUP OF EDUCATION PRIVATE LIMITED',
    state: 'Jammu & Kashmir',
    district: 'Baramulla',
    roc: 'ROC Jammu',
    nicCode: '85500',
    nicLabel: 'EDUCATION',
    classOfCompany: 'Private',
    dateOfIncorporation: '07/28/2026',
    paidUpCapital: 100000,
    email: 'DELTAEDUCATIONALCONSULTANCY786@GMAIL.COM',
    directorName: 'ABDUL AZIZ WANI',
    directorEmail: 'JAVAIDQUANTUM111@GMAIL.COM',
    directorMobile: sanitizePhone('`9797836641'),
    authorizedCapital: 1500000,
    status: 'New',
    notes: [
      {
        id: 'note-1',
        text: 'Initial record imported from July 2026 dataset.',
        createdAt: new Date().toISOString(),
        author: 'System'
      }
    ],
    batchId: 'Batch - July 2026 Initial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    compositeKey: generateCompositeKey('U85500JK2026PTC019669', 'JAVAID AHMAD WANI', 'JAVAIDQUANTUM786@GMAIL.COM'),
    entityId: 'U85500JK2026PTC019669',
    entityType: 'company',
    name: 'DELTA GROUP OF EDUCATION PRIVATE LIMITED',
    state: 'Jammu & Kashmir',
    district: 'Baramulla',
    roc: 'ROC Jammu',
    nicCode: '85500',
    nicLabel: 'EDUCATION',
    classOfCompany: 'Private',
    dateOfIncorporation: '07/28/2026',
    paidUpCapital: 100000,
    email: 'DELTAEDUCATIONALCONSULTANCY786@GMAIL.COM',
    directorName: 'JAVAID AHMAD WANI',
    directorEmail: 'JAVAIDQUANTUM786@GMAIL.COM',
    directorMobile: sanitizePhone('`6005098403'),
    authorizedCapital: 1500000,
    status: 'Contacted',
    notes: [
      {
        id: 'note-2',
        text: 'Director reached out via email. Sent corporate introduction brochure.',
        createdAt: new Date().toISOString(),
        author: 'Sales Rep'
      }
    ],
    batchId: 'Batch - July 2026 Initial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    compositeKey: generateCompositeKey('ADA-4900', 'AVANI GUPTA', 'AVANIGUPTA.WORK@GMAIL.COM'),
    entityId: 'ADA-4900',
    entityType: 'llp',
    name: 'AKARO STUDIO LLP',
    state: 'Rajasthan',
    district: 'Jaipur',
    roc: 'ROC Jaipur',
    nicCode: '74',
    nicLabel: 'OTHER PROFESSIONAL, SCIENTIFIC AND TECHNICAL ACTIVITIES',
    classOfCompany: 'LLP',
    dateOfIncorporation: '07/28/2026',
    paidUpCapital: 0,
    email: 'hello.akarostudio@gmail.com',
    directorName: 'AVANI GUPTA',
    directorEmail: 'AVANIGUPTA.WORK@GMAIL.COM',
    directorMobile: sanitizePhone('`9636160541'),
    authorizedCapital: 0,
    status: 'In Discussion',
    notes: [
      {
        id: 'note-3',
        text: 'Scheduled initial consultation call with Avani Gupta.',
        createdAt: new Date().toISOString(),
        author: 'CRM Manager'
      }
    ],
    batchId: 'Batch - July 2026 Initial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const RAW_SAMPLE_CSV_TEXT = `entityId\tentityType\tname\tstate\tdistrict\troc\tnicCode\tnicLabel\tclassOfCompany\tdateOfIncorporation\tpaidUpCapital\temail\tdirectorName\tdirectorEmail\tdirectorMobile\tauthorizedCapital
U85500JK2026PTC019669\tcompany\tDELTA GROUP OF EDUCATION PRIVATE LIMITED\tJammu & Kashmir\tBaramulla\tROC Jammu\t85500\tEDUCATION\tPrivate\t07/28/2026\t100000\tDELTAEDUCATIONALCONSULTANCY786@GMAIL.COM\tABDUL AZIZ WANI\tJAVAIDQUANTUM111@GMAIL.COM\t\`9797836641\t1500000
U85500JK2026PTC019669\tcompany\tDELTA GROUP OF EDUCATION PRIVATE LIMITED\tJammu & Kashmir\tBaramulla\tROC Jammu\t85500\tEDUCATION\tPrivate\t07/28/2026\t100000\tDELTAEDUCATIONALCONSULTANCY786@GMAIL.COM\tJAVAID AHMAD WANI\tJAVAIDQUANTUM786@GMAIL.COM\t\`6005098403\t1500000
ADA-4900\tllp\tAKARO STUDIO LLP\tRajasthan\tJaipur\tROC Jaipur\t74\tOTHER PROFESSIONAL, SCIENTIFIC AND TECHNICAL ACTIVITIES\tLLP\t07/28/2026\t0\thello.akarostudio@gmail.com\tAVANI GUPTA\tAVANIGUPTA.WORK@GMAIL.COM\t\`9636160541\t0`;
