import { useListFaq, getListFaqQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Faq() {
  const { data: faqs, isLoading } = useListFaq({
    query: { queryKey: getListFaqQueryKey() },
  });

  return (
    <Layout>
      <section className="relative py-32 px-4 text-center bg-card">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">Help Center</p>
          <h1 className="font-serif italic text-5xl md:text-6xl mb-6">Frequently Asked Questions</h1>
          <div className="h-px w-16 bg-primary mx-auto mb-8" />
          <p className="text-muted-foreground text-lg font-light">
            Everything you need to know about shopping with BOTH & CO.
          </p>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-0">
              {faqs?.map((faq, idx) => (
                <AccordionItem
                  key={faq.id}
                  value={`faq-${faq.id}`}
                  className="border-b border-border"
                  data-testid={`faq-item-${faq.id}`}
                >
                  <AccordionTrigger className="py-6 text-left font-serif text-lg hover:text-primary hover:no-underline transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          <div className="mt-20 text-center bg-card border border-border p-10">
            <h3 className="font-serif text-2xl mb-4">Still have questions?</h3>
            <p className="text-muted-foreground mb-8 text-sm">
              Our team is happy to help. Reach out via our contact page or WhatsApp.
            </p>
            <a href="/contact">
              <button className="border border-primary text-primary px-10 py-4 text-xs tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                Contact Us
              </button>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
