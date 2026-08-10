"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Плейсхолдер видео: кнопка play открывает модалку "Video coming soon" */
export function VideoPlaceholder() {
  return (
    <section className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          See how it works
        </h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          A 15-second walkthrough of splitting your first subscription.
        </p>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="mt-10 h-20 w-20 rounded-full p-0"
              aria-label="Play video: See how it works"
            >
              <Play className="ml-1 h-8 w-8 fill-primary text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>See how it works (15 sec)</DialogTitle>
              <DialogDescription>Video coming soon</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <p className="mt-4 text-sm text-muted-foreground">
          See how it works (15 sec)
        </p>
      </div>
    </section>
  );
}
