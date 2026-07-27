import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Clock } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

export default function CareerOpenings() {
  // No current openings
  const hasOpenings = false;

  return (
    <div className="py-16">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <Badge className="mb-4 px-4 py-2 text-sm font-medium">
          Current Openings
        </Badge>
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Open Positions</h2>
      </motion.div>

      {!hasOpenings ? (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <Card className="mx-auto max-w-3xl border-0 shadow-lg">
            <CardContent className="p-8 text-center lg:p-12">
              <div className="mb-6">
                <Briefcase className="text-muted-foreground/50 mx-auto h-16 w-16" />
              </div>
              <h3 className="mb-4 text-2xl font-bold">
                No Open Positions at the Moment
              </h3>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                We don't have any open positions right now, but we're always
                looking for talented individuals who share our passion for AI
                innovation. Keep an eye on this page for future opportunities!
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/contact" className="no-underline">
                  <Button size="lg" variant="outline" className="px-8">
                    Send Us Your Resume
                  </Button>
                </Link>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Check back soon for updates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        // This section will be used when there are job openings
        <div className="grid grid-cols-1 gap-6">
          {/* Job listing cards will go here */}
        </div>
      )}
    </div>
  );
}
