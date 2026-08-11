import { HelpCircle } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/faq";

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

        <div className="mt-10 text-center text-sm text-muted-foreground">
          Still have questions? Check{" "}
          <Link href="/blog" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            our blog
          </Link>{" "}
          or see{" "}
          <Link href="/pricing" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            pricing plans
          </Link>{" "}
          to get started.
        </div>
      </div>
    </section>
  );
}
