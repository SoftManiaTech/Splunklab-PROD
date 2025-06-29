import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqData = [
  {
    id: "can-onboard-own-data",
    question: "Can I onboard my own data source?",
    answer: ["You have full control over the rented servers.", "You can onboard any of your own data sources."],
  },
  {
    id: "live-data-sources",
    question: "Does this environment come with live data sources?",
    answer: ["Not yet, this feature is planned for future versions."],
  },
  {
    id: "refund-policy",
    question: "Will I get a refund?",
    answer: ["No, refunds are not provided.", "Server provisioning starts immediately after purchase."],
  },
  {
    id: "has-es-itsi",
    question: "Does this environment include Splunk ES or ITSI?",
    answer: [
      "We provide only the free version of Splunk Enterprise.",
      "You can install ES or ITSI using your own license (BYOL).",
    ],
  },
  {
    id: "what-is-this",
    question: "What does this lab service provide?",
    answer: [
      "Hourly-based Splunk lab environments.",
      "Preloaded datasets like BOTSv3.",
      "Essential Splunk add-ons.",
      "Standalone, distributed, or clustered setups.",
    ],
  },
  {
    id: "who-is-this-for",
    question: "Who is this Splunk lab for?",
    answer: [
      "Beginners learning Splunk.",
      "Certification exam preparation.",
      "Professionals needing real-world practice.",
    ],
  },
  {
    id: "support-available",
    question: "Is 24/7 support included?",
    answer: ["No, 24/7 support is not included.", "Free basic course guidance is available."],
  },
  {
    id: "demo-dataset",
    question: "What demo data is included?",
    answer: ["BOTSv3 dataset for threat simulation.", "Realistic logs for hands-on practice."],
  },
  {
    id: "env-types",
    question: "Can I choose different types of environments?",
    answer: ["Yes, choose from:", "• Standalone", "• Non-clustered distributed", "• Clustered Splunk setups"],
  },
  {
    id: "cert-prep",
    question: "Is this lab suitable for certification practice?",
    answer: [
      "Yes, it's perfect for practicing lab exercises and exam preparation.",
      "Ideal for testing real-world Splunk scenarios.",
    ],
  },
]

export function LabFAQ() {
  return (
    <section id="faq" className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900 tracking-tight">
          Frequently Asked Questions
        </h2>
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-2 sm:space-y-4">
            {faqData.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border border-gray-200 rounded-lg px-4 sm:px-6">
                <AccordionTrigger className="text-gray-800 hover:text-green-600 transition-colors duration-200 font-medium text-sm sm:text-base py-4 sm:py-6 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 sm:pb-6">
                  <ul className="text-xs sm:text-sm text-gray-600 space-y-2 pl-4">
                    {faq.answer.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
