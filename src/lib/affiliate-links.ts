// Affiliate tracking links for course recommendations.
// Replace placeholder URLs with actual affiliate links once program applications are approved.
// Apply at: Coursera (Impact Radius), Udemy (Impact Radius), AWS Associates (associates.amazon.com)

const UTM = "utm_source=aicareerp&utm_medium=affiliate&utm_campaign=course-rec";

export const AFFILIATE_LINKS = {
  coursera: {
    googleAiEssentials: `https://www.coursera.org/learn/google-ai-essentials?${UTM}`,
    ibmAiProductManager: `https://www.coursera.org/specializations/ai-product-management?${UTM}`,
    aiForEveryone: `https://www.coursera.org/learn/ai-for-everyone?${UTM}`,
    marketingAnalyticsMeta: `https://www.coursera.org/professional-certificates/facebook-marketing-analytics?${UTM}`,
    googleDataAnalytics: `https://www.coursera.org/professional-certificates/google-data-analytics?${UTM}`,
    ibmDataScience: `https://www.coursera.org/professional-certificates/ibm-data-science?${UTM}`,
    aiForMedicalDiagnosis: `https://www.coursera.org/learn/ai-for-medical-diagnosis?${UTM}`,
    subscription: `https://www.coursera.org/courseraplus?${UTM}`,
  },
  udemy: {
    homepage: `https://www.udemy.com/?${UTM}`,
  },
  aws: {
    skillBuilder: `https://explore.skillbuilder.aws/?${UTM}`,
    aiPractitioner: `https://aws.amazon.com/certification/certified-ai-practitioner/?${UTM}`,
  },
  hubspot: {
    aiMarketing: `https://academy.hubspot.com/courses/ai-for-marketers?${UTM}`,
  },
} as const;
