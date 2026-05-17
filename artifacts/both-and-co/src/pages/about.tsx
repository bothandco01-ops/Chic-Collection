import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <Layout>
      <section className="relative py-32 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card to-background" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">Our Story</p>
          <h1 className="font-serif italic text-5xl md:text-7xl mb-6 leading-tight">
            Born from the<br />Desire to Stand Out
          </h1>
          <div className="h-px w-16 bg-primary mx-auto" />
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="aspect-[3/4] bg-card overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800"
                alt="BOTH & CO. brand"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          </div>
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">Who We Are</p>
            <h2 className="font-serif italic text-4xl mb-8 leading-tight">
              Luxury crafted for<br />the bold, modern woman
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                BOTH & CO. was founded with a singular vision: to bring editorial-quality luxury accessories to Nigerian women who refuse to settle for ordinary.
              </p>
              <p>
                We believe that a pair of perfectly crafted heels or an oversized pair of glasses is not just an accessory — it is a statement, a mood, an armour. Every piece in our collection is curated with obsessive attention to quality, silhouette, and the feeling it evokes.
              </p>
              <p>
                We are for the woman who walks into a room and changes its atmosphere. Who dresses for herself first, and the world second.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4">Our Values</p>
            <h2 className="font-serif italic text-4xl">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Uncompromising Quality",
                text: "Every piece is hand-selected and inspected. We carry only what we would wear ourselves.",
              },
              {
                title: "Feminine Power",
                text: "We celebrate femininity in all its forms — sensual, strong, quiet, loud. There is no wrong way to be a woman.",
              },
              {
                title: "Nigerian Pride",
                text: "We are building something beautiful for Nigerian women, by people who understand and love this culture deeply.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="h-px w-8 bg-primary mx-auto mb-8" />
                <h3 className="font-serif text-xl mb-4">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif italic text-4xl mb-6">Ready to find your next statement piece?</h2>
          <p className="text-muted-foreground mb-10">Browse our curated collection of luxury heels and glasses.</p>
          <Link href="/shop">
            <Button className="rounded-none px-12 py-5 tracking-widest uppercase text-xs">
              Shop the Collection
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
