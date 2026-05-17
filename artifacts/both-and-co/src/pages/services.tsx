import { useListServices, getListServicesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Wrench, Gift, Crown, Users, Zap, Star } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-6 w-6" />,
  Wrench: <Wrench className="h-6 w-6" />,
  Gift: <Gift className="h-6 w-6" />,
  Crown: <Crown className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
};

export default function Services() {
  const { data: services, isLoading } = useListServices({
    query: { queryKey: getListServicesQueryKey() },
  });

  return (
    <Layout>
      <section className="relative py-32 px-4 text-center bg-card">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">What We Offer</p>
          <h1 className="font-serif italic text-5xl md:text-6xl mb-6">Our Services</h1>
          <div className="h-px w-16 bg-primary mx-auto mb-8" />
          <p className="text-muted-foreground text-lg font-light max-w-xl mx-auto">
            Beyond beautiful products, we offer a suite of luxury services designed to elevate your entire experience.
          </p>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services?.map((service) => (
                <div
                  key={service.id}
                  className="bg-card border border-border p-8 hover:border-primary transition-colors duration-300 group"
                  data-testid={`service-card-${service.id}`}
                >
                  <div className="text-primary mb-6 group-hover:scale-110 transition-transform duration-300 inline-block">
                    {iconMap[service.icon || ""] || <Star className="h-6 w-6" />}
                  </div>
                  <h3 className="font-serif text-xl mb-4">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 bg-card text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">Get In Touch</p>
          <h2 className="font-serif italic text-4xl mb-6">Need a bespoke service?</h2>
          <p className="text-muted-foreground mb-10">
            Our team is available to create a tailored experience for your specific needs. Reach out and let's talk.
          </p>
          <a href="/contact">
            <button className="border border-primary text-primary px-12 py-4 text-xs tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
              Contact Us
            </button>
          </a>
        </div>
      </section>
    </Layout>
  );
}
