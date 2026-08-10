import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "How do my friends actually pay me back?",
    a: "SubSplit tracks who owes what. Your friends pay you back via Venmo, Cash App, Zelle, or PayPal — whatever you already use.",
  },
  {
    q: "Is my subscription data secure?",
    a: "Yes. We use bank-level encryption. We never store your streaming passwords.",
  },
  {
    q: "What if a friend doesn't pay?",
    a: "We'll remind them nicely at first, then with memes. You can also remove them from the group.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Absolutely. Cancel in one click, no questions asked.",
  },
  {
    q: "Do you handle the actual money transfer?",
    a: "No — we only track and remind. You keep using your favorite payment app.",
  },
] as const;

/** FAQ-аккордеон на лендинге */
export function FAQ() {
  return (
    <section id="faq" className="border-t bg-muted/40">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
