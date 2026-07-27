import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Mail } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

export default function CareerCTA() {
  return (
    <div className="py-16 pb-24">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Card className="overflow-hidden border-0 px-5 shadow-lg">
          <div className="from-primary to-primary/80 rounded-[5px] bg-gradient-to-r p-1">
            <CardContent className="bg-background p-8 lg:p-12">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Stay Updated */}
                <div className="text-center md:text-left">
                  <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full">
                    <Bell className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">Stay Updated</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Want to be notified when new positions open? Follow us on
                    social media or check back regularly for the latest
                    opportunities.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="https://linkedin.com/company/shothik-ai"
                      target="_blank"
                      className="no-underline"
                    >
                      <Button variant="outline" className="w-full sm:w-auto">
                        Follow on LinkedIn
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Get in Touch */}
                <div className="text-center md:text-left">
                  <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full">
                    <Mail className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">Have Questions?</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Want to learn more about working at Shothik AI or have
                    questions about potential opportunities? We'd love to hear
                    from you!
                  </p>
                  <Link href="/contact" className="no-underline">
                    <Button className="w-full px-8 sm:w-auto">
                      Contact Our Team
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-border mt-8 border-t pt-8 text-center">
                <p className="text-muted-foreground text-sm">
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
