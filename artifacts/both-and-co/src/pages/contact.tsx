import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle, Mail, MessageSquare, Phone } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(20, "Please write a more detailed message"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = (data: ContactForm) => {
    setSubmitted(true);
  };

  return (
    <Layout>
      <section className="relative py-32 px-4 text-center bg-card">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">Get In Touch</p>
          <h1 className="font-serif italic text-5xl md:text-6xl mb-6">Contact Us</h1>
          <div className="h-px w-16 bg-primary mx-auto mb-8" />
          <p className="text-muted-foreground text-lg font-light">
            We love hearing from our customers. Whether it is a question about an order or just to say hello, we are here.
          </p>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h3 className="font-serif text-2xl mb-10">Reach Out</h3>
            <div className="space-y-8 mb-12">
              {[
                {
                  icon: <Mail className="h-5 w-5" />,
                  label: "Email",
                  value: "hello@bothandco.com",
                  sub: "We respond within 24 hours",
                },
                {
                  icon: <Phone className="h-5 w-5" />,
                  label: "WhatsApp",
                  value: "+234 800 123 4567",
                  sub: "Monday – Saturday, 9am – 6pm",
                },
                {
                  icon: <MessageSquare className="h-5 w-5" />,
                  label: "Instagram DM",
                  value: "@bothandco",
                  sub: "For styling questions and order updates",
                },
              ].map((item) => (
                <div key={item.label} className="flex gap-5">
                  <div className="text-primary mt-1 flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-8">
              <h4 className="font-serif text-lg mb-4">Follow Us</h4>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors tracking-widest uppercase text-xs">Instagram</a>
                <a href="#" className="hover:text-primary transition-colors tracking-widest uppercase text-xs">Twitter</a>
                <a href="#" className="hover:text-primary transition-colors tracking-widest uppercase text-xs">TikTok</a>
              </div>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="bg-card border border-border p-12 text-center h-full flex flex-col items-center justify-center">
                <CheckCircle className="h-12 w-12 text-primary mb-6" />
                <h3 className="font-serif italic text-2xl mb-4">Message Sent</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Thank you for reaching out. We will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border p-8">
                <h3 className="font-serif text-xl mb-8">Send a Message</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="rounded-none border-border bg-background" data-testid="input-contact-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="rounded-none border-border bg-background" data-testid="input-contact-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Subject</FormLabel>
                          <FormControl>
                            <Input {...field} className="rounded-none border-border bg-background" data-testid="input-contact-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Message</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={5} className="rounded-none border-border bg-background resize-none" data-testid="input-contact-message" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full rounded-none py-5 tracking-widest uppercase text-xs"
                      data-testid="button-send-message"
                    >
                      Send Message
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
