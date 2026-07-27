"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, UserPlus } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

export default function TeamCTA() {
  return (
    <div className="py-16 pb-24">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="from-primary to-primary/80 bg-gradient-to-r p-1">
            <CardContent className="bg-background p-8 lg:p-12">
              <div className="mx-auto max-w-3xl text-center">
                <h3 className="mb-4 text-2xl font-bold lg:text-3xl">
                  Want to Join Our Team?
                </h3>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  We're always looking for talented individuals who share our
                  passion for AI innovation and want to make a difference in the
                  world of content creation.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Link href="/career" className="no-underline">
                    <Button size="lg" className="px-8">
                      <UserPlus className="mr-2 h-5 w-5" />
                      View Career Opportunities
                    </Button>
                  </Link>
                  <Link href="/contact" className="no-underline">
                    <Button variant="outline" size="lg" className="px-8">
                      <Mail className="mr-2 h-5 w-5" />
                      Get In Touch
                    </Button>
                  </Link>
                </div>
                <p className="text-muted-foreground mt-6 text-sm">
                  For career inquiries:{" "}
                  <a
                    href="mailto:careers@shothik.ai"
                    className="text-primary hover:underline"
                  >
                    careers@shothik.ai
                  </a>
                </p>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
